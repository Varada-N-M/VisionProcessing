"""AI study coach response generation with provider fallback and safety guardrails."""

from __future__ import annotations

import json
import math
import os
import re
import urllib.error
import urllib.request
from typing import Any

from coach_feature.prompts import (
    build_system_prompt,
    build_user_prompt,
    normalize_age_group,
    normalize_intent,
)

HIGH_RISK_PATTERN = re.compile(
    r"\b("
    r"kill myself|want to die|end my life|suicide|self harm|self-harm|hurt myself|"
    r"someone hurts me|being hurt at home|abuse|unsafe at home|can't stay safe"
    r")\b",
    flags=re.IGNORECASE,
)


def _contains_high_risk_signal(text: str) -> bool:
    return bool(HIGH_RISK_PATTERN.search(text))


def _safety_response() -> str:
    return (
        "Thank you for telling me. Your safety matters most right now.\n"
        "Please tell a trusted adult right away: parent, teacher, or school counselor.\n"
        "If you might be in immediate danger, contact local emergency services now.\n"
        "If talking feels hard, show this message to an adult so they can help.\n"
        "You are not alone, and you deserve support."
    )


def _enforce_line_limits(text: str, min_lines: int = 4, max_lines: int = 6) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if len(lines) > max_lines:
        return "\n".join(lines[:max_lines])
    if len(lines) >= min_lines:
        return "\n".join(lines)
    chunks = [chunk.strip() for chunk in re.split(r"(?<=[.!?])\s+", text) if chunk.strip()]
    if not chunks:
        return text.strip()
    if len(chunks) > max_lines:
        chunks = chunks[:max_lines]
    while len(chunks) < min_lines:
        chunks.append(chunks[-1])
    return "\n".join(chunks)


def _count_tokens_estimate(text: str) -> int:
    return max(1, math.ceil(len(text) / 4))


def _extract_error_message(payload: Any) -> str:
    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict):
            if isinstance(error.get("message"), str):
                return error["message"]
            if isinstance(error.get("type"), str):
                return error["type"]
        if isinstance(error, str):
            return error
        if isinstance(payload.get("message"), str):
            return payload["message"]
    return "Unknown provider error"


def _post_json(url: str, payload: dict[str, Any], headers: dict[str, str], timeout: int) -> dict[str, Any]:
    req = urllib.request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
        return json.loads(body)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="ignore")
        message = body.strip()
        try:
            parsed = json.loads(body)
            message = _extract_error_message(parsed)
        except json.JSONDecodeError:
            if not message:
                message = f"HTTP {error.code}"
        raise RuntimeError(message) from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Network error: {error.reason}") from error
    except json.JSONDecodeError as error:
        raise RuntimeError("Provider returned invalid JSON.") from error


def _format_history(conversation_history: list[dict[str, str]]) -> str:
    if not conversation_history:
        return "No prior conversation."
    history_lines: list[str] = []
    for message in conversation_history[-20:]:
        if not isinstance(message, dict):
            continue
        role = str(message.get("role", "user")).strip().lower()
        speaker = "Coach" if role == "assistant" else "Student"
        content = str(message.get("content", "")).strip()
        if content:
            history_lines.append(f"{speaker}: {content}")
    return "\n".join(history_lines) if history_lines else "No prior conversation."


def _build_prompts(
    user_input: str,
    emotion: str,
    intent: str,
    age_group: str,
    conversation_history: list[dict[str, str]],
) -> tuple[str, str]:
    normalized_intent = normalize_intent(intent)
    normalized_age_group = normalize_age_group(age_group)
    system_prompt = build_system_prompt(age_group=normalized_age_group, intent=normalized_intent)
    user_prompt = (
        build_user_prompt(
            user_input=user_input,
            emotion=emotion,
            intent=normalized_intent,
            age_group=normalized_age_group,
        )
        + "\nRecent conversation:\n"
        + _format_history(conversation_history)
    )
    return system_prompt, user_prompt


def _openai_respond(system_prompt: str, user_prompt: str) -> tuple[str, int]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured.")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").strip().rstrip("/")
    timeout = int(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": float(os.getenv("LLM_TEMPERATURE", "0.4")),
        "max_tokens": int(os.getenv("LLM_MAX_OUTPUT_TOKENS", "220")),
    }
    data = _post_json(
        url=f"{base_url}/chat/completions",
        payload=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        timeout=timeout,
    )
    choices = data.get("choices", [])
    if not choices:
        raise RuntimeError("OpenAI returned no choices.")
    message = choices[0].get("message", {})
    text = str(message.get("content", "")).strip()
    if not text:
        raise RuntimeError("OpenAI returned an empty response.")
    usage = data.get("usage", {})
    total_tokens = int(usage.get("total_tokens", 0))
    if total_tokens <= 0:
        total_tokens = _count_tokens_estimate(system_prompt + user_prompt + text)
    return _enforce_line_limits(text), total_tokens


def _gemini_respond(system_prompt: str, user_prompt: str) -> tuple[str, int]:
    api_key = os.getenv("GEMINI_KEY", "").strip() or os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_KEY or GEMINI_API_KEY is not configured.")
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()
    timeout = int(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": float(os.getenv("LLM_TEMPERATURE", "0.4")),
            "maxOutputTokens": int(os.getenv("LLM_MAX_OUTPUT_TOKENS", "220")),
        },
    }
    data = _post_json(
        url=f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
        payload=payload,
        headers={"Content-Type": "application/json"},
        timeout=timeout,
    )
    candidates = data.get("candidates", [])
    if not candidates:
        raise RuntimeError("Gemini returned no candidates.")
    parts = candidates[0].get("content", {}).get("parts", [])
    text = "".join(part.get("text", "") for part in parts if isinstance(part, dict)).strip()
    if not text:
        raise RuntimeError("Gemini returned an empty response.")
    usage = data.get("usageMetadata", {})
    total_tokens = int(usage.get("totalTokenCount", 0))
    if total_tokens <= 0:
        total_tokens = _count_tokens_estimate(system_prompt + user_prompt + text)
    return _enforce_line_limits(text), total_tokens


def _ollama_respond(system_prompt: str, user_prompt: str) -> tuple[str, int]:
    host = os.getenv("OLLAMA_HOST", "http://localhost:11434").strip().rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "llama3.1").strip()
    timeout = int(os.getenv("LLM_TIMEOUT_SECONDS", "45"))
    payload = {
        "model": model,
        "stream": False,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "options": {
            "temperature": float(os.getenv("LLM_TEMPERATURE", "0.4")),
            "num_predict": int(os.getenv("LLM_MAX_OUTPUT_TOKENS", "220")),
        },
    }
    data = _post_json(
        url=f"{host}/api/chat",
        payload=payload,
        headers={"Content-Type": "application/json"},
        timeout=timeout,
    )
    text = str(data.get("message", {}).get("content", "")).strip()
    if not text:
        raise RuntimeError("Ollama returned an empty response.")
    total_tokens = int(data.get("prompt_eval_count", 0)) + int(data.get("eval_count", 0))
    if total_tokens <= 0:
        total_tokens = _count_tokens_estimate(system_prompt + user_prompt + text)
    return _enforce_line_limits(text), total_tokens


def _local_cbt_fallback(emotion: str, intent: str, age_group: str) -> str:
    normalized_intent = normalize_intent(intent)
    normalized_age_group = normalize_age_group(age_group)
    emotion_text = (emotion or "unspecified").strip().lower()

    starter = {
        "8-10": "Thanks for sharing. It is okay to feel this way.",
        "11-13": "Thanks for opening up. Your feeling makes sense.",
        "14-15": "Thanks for being honest. What you feel is valid.",
        "unspecified": "Thanks for sharing. Your feeling matters.",
    }[normalized_age_group]

    if normalized_intent == "exam_stress":
        return _enforce_line_limits(
            f"{starter}\n"
            "A worried thought is not always a fact.\n"
            "Have you started studying yet? If yes, tell me the hardest topic.\n"
            "Break that hard topic into 3 tiny steps: read, one example, one quiz.\n"
            "You can do one small step now, then take a short break."
        )
    if normalized_intent == "productivity":
        return _enforce_line_limits(
            f"{starter}\n"
            "Getting stuck does not mean you cannot improve.\n"
            "Pick one tiny task that takes two minutes to start.\n"
            "Try one focus round: 20 minutes work, 5 minutes break.\n"
            "After one round, mark one win and continue."
        )
    if normalized_intent == "thought_challenge":
        return _enforce_line_limits(
            f"{starter}\n"
            "Let us test the thought gently.\n"
            "What is the worry, and what evidence supports it?\n"
            "What evidence goes against it from your real experience?\n"
            "Now make one balanced thought and take one small action."
        )
    if normalized_intent == "coping_strategy":
        return _enforce_line_limits(
            f"{starter}\n"
            "Let us calm your body first with box breathing.\n"
            "Inhale 4, hold 4, exhale 4, hold 4, repeat four times.\n"
            "Then choose one tiny next step for study.\n"
            "Small calm steps help your brain learn better."
        )
    return _enforce_line_limits(
        f"{starter}\n"
        f"You said you feel {emotion_text if emotion_text else 'upset'}, and that is okay.\n"
        "A hard moment does not define your ability.\n"
        "Choose one small next step you can finish in 10 minutes.\n"
        "After that step, pause and notice one thing you did well."
    )


def generate_coach_response(
    *,
    user_input: str,
    emotion: str = "unspecified",
    intent: str = "general",
    age_group: str = "unspecified",
    conversation_history: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    cleaned_input = user_input.strip()
    if not cleaned_input:
        raise ValueError("user_input must be a non-empty string.")

    normalized_intent = normalize_intent(intent)
    normalized_age_group = normalize_age_group(age_group)
    normalized_emotion = (emotion or "unspecified").strip() or "unspecified"
    history = conversation_history or []

    if _contains_high_risk_signal(cleaned_input):
        return {
            "response": _safety_response(),
            "intent": normalized_intent,
            "emotion": normalized_emotion,
            "age_group": normalized_age_group,
            "api_used": "safety_guard",
            "tokens_used": 0,
        }

    system_prompt, user_prompt = _build_prompts(
        user_input=cleaned_input,
        emotion=normalized_emotion,
        intent=normalized_intent,
        age_group=normalized_age_group,
        conversation_history=history,
    )

    provider = os.getenv("LLM_PROVIDER", "gemini").strip().lower()
    responders = {
        "openai": _openai_respond,
        "gemini": _gemini_respond,
        "ollama": _ollama_respond,
    }

    provider_order = [provider] + [name for name in ("gemini", "openai", "ollama") if name != provider]
    errors: list[str] = []
    for provider_name in provider_order:
        responder = responders.get(provider_name)
        if responder is None:
            continue
        try:
            response_text, token_count = responder(system_prompt=system_prompt, user_prompt=user_prompt)
            return {
                "response": response_text,
                "intent": normalized_intent,
                "emotion": normalized_emotion,
                "age_group": normalized_age_group,
                "api_used": provider_name,
                "tokens_used": token_count,
            }
        except RuntimeError as error:
            errors.append(f"{provider_name}: {error}")

    local_enabled = os.getenv("LOCAL_FALLBACK_ENABLED", "true").strip().lower() == "true"
    if local_enabled:
        return {
            "response": _local_cbt_fallback(
                emotion=normalized_emotion,
                intent=normalized_intent,
                age_group=normalized_age_group,
            ),
            "intent": normalized_intent,
            "emotion": normalized_emotion,
            "age_group": normalized_age_group,
            "api_used": "local_fallback",
            "tokens_used": 0,
        }

    raise RuntimeError("All providers failed. " + " | ".join(errors))
