"""
Concept Extraction using Sarvam AI

Pipeline
--------
  Step 1 - Sarvam Vision (Document Intelligence API)
           OCR on the uploaded image -> Markdown text.
           Supports 22 Indian scripts + English.

  Step 2 - Sarvam Chat Completion
           Reads the OCR text -> structured JSON of key concepts.

Required .env variables
-----------------------
    SARVAM_API_KEY   Your Sarvam AI API subscription key
"""
import json
import base64
import os
import tempfile
import zipfile
from io import BytesIO

import requests
from PIL import Image
from sarvamai import SarvamAI
from dotenv import load_dotenv

load_dotenv(override=True)

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

_SARVAM_CHAT_URL = "https://api.sarvam.ai/v1/chat/completions"
_SARVAM_CHAT_MODEL = "sarvam-2-small"


class ConceptExtractor:
    """Concept extractor using Sarvam Vision + Chat (with demo fallback)"""

    @staticmethod
    def _get_demo_concepts():
        return {
            "concepts": [
                {"id": "concept_1", "name": "Photosynthesis",
                 "summary": "Process by which green plants convert sunlight into energy using chlorophyll.",
                 "category": "Biology", "region": {"x1": 0.05, "y1": 0.05, "x2": 0.45, "y2": 0.25}},
                {"id": "concept_2", "name": "Chlorophyll",
                 "summary": "Green pigment in plant cells that absorbs sunlight for photosynthesis.",
                 "category": "Biology", "region": {"x1": 0.05, "y1": 0.30, "x2": 0.45, "y2": 0.50}},
                {"id": "concept_3", "name": "Glucose",
                 "summary": "A simple sugar produced as the output of photosynthesis, used for plant energy.",
                 "category": "Chemistry", "region": {"x1": 0.05, "y1": 0.55, "x2": 0.45, "y2": 0.75}},
            ],
            "source": "demo",
        }

    # -- Step 1: OCR via Sarvam Vision --
    @staticmethod
    def _extract_text_with_sarvam_vision(img_bytes):
        client = SarvamAI(api_subscription_key=SARVAM_API_KEY)

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(img_bytes)
            tmp_path = tmp.name

        out_zip_path = None
        try:
            job = client.document_intelligence.create_job(language="en-IN", output_format="md")
            print(f"[Sarvam Vision] Job created: {job.job_id}")

            job.upload_file(tmp_path)
            job.start()
            print("[Sarvam Vision] Processing...")
            status = job.wait_until_complete()
            print(f"[Sarvam Vision] Done - state: {status.job_state}")

            with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as zf:
                out_zip_path = zf.name
            job.download_output(out_zip_path)

            markdown_text = ""
            with zipfile.ZipFile(out_zip_path, "r") as zf:
                for name in zf.namelist():
                    if name.endswith(".md"):
                        markdown_text = zf.read(name).decode("utf-8")
                        break
                if not markdown_text:
                    for name in zf.namelist():
                        if name.endswith(".html"):
                            markdown_text = zf.read(name).decode("utf-8")
                            break

            print(f"[Sarvam Vision] Extracted {len(markdown_text)} chars")
            return markdown_text
        finally:
            for p in (tmp_path, out_zip_path):
                if p:
                    try:
                        os.unlink(p)
                    except OSError:
                        pass

    # -- Step 2: Concept identification via Sarvam Chat --
    @staticmethod
    def _identify_concepts_with_sarvam_chat(extracted_text):
        system_prompt = (
            "You are an expert at identifying key educational concepts from student notes.\n"
            "Given the extracted text, identify the main concepts/topics.\n"
            "Respond with ONLY a valid JSON array - no markdown, no explanation.\n\n"
            "Each object must have:\n"
            '- "id": e.g. "concept_1"\n'
            '- "name": short concept name (2-5 words)\n'
            '- "summary": one clear sentence\n'
            '- "category": subject area\n'
        )

        headers = {"api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json"}
        payload = {
            "model": _SARVAM_CHAT_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Notes text:\n\n{extracted_text}\n\nReturn concepts as JSON array."},
            ],
            "temperature": 0.2,
            "max_tokens": 2000,
        }

        print(f"[Sarvam Chat] Calling {_SARVAM_CHAT_MODEL}...")
        resp = requests.post(_SARVAM_CHAT_URL, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()

        raw = resp.json()["choices"][0]["message"]["content"].strip()
        print(f"[Sarvam Chat] Response ({len(raw)} chars)")

        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

        return json.loads(raw)

    # -- Assign bounding regions evenly --
    @staticmethod
    def _assign_regions(concepts):
        n = max(len(concepts), 1)
        step = 1.0 / n
        for i, c in enumerate(concepts):
            if "region" not in c:
                c["region"] = {"x1": 0.02, "y1": round(i * step, 4),
                               "x2": 0.98, "y2": round((i + 1) * step, 4)}
        return concepts

    # -- Public entry point (same signature as before) --
    @staticmethod
    def extract_concepts_from_highlighted_region(image_data, highlight_box=None, use_demo=False):
        if use_demo or not SARVAM_API_KEY:
            print("[Concept Extraction] Demo mode (no SARVAM_API_KEY)")
            return ConceptExtractor._get_demo_concepts()

        try:
            image = Image.open(BytesIO(base64.b64decode(image_data)))
            if highlight_box:
                image = image.crop(highlight_box)

            buf = BytesIO()
            image.save(buf, format="PNG")
            img_bytes = buf.getvalue()

            # Step 1
            print("[Concept Extraction] Step 1 - Sarvam Vision OCR...")
            extracted_text = ConceptExtractor._extract_text_with_sarvam_vision(img_bytes)
            if not extracted_text or not extracted_text.strip():
                print("[Concept Extraction] No text extracted - falling back to demo")
                return ConceptExtractor._get_demo_concepts()

            # Step 2
            print("[Concept Extraction] Step 2 - Sarvam Chat concepts...")
            concepts_list = ConceptExtractor._identify_concepts_with_sarvam_chat(extracted_text)

            # Step 3
            concepts_list = ConceptExtractor._assign_regions(concepts_list)
            for i, c in enumerate(concepts_list):
                c.setdefault("id", f"concept_{i+1}")
                c.setdefault("category", "General")
                c.setdefault("summary", c.get("description", ""))

            print(f"[Concept Extraction] {len(concepts_list)} concepts via Sarvam AI")
            return {"concepts": concepts_list, "source": "sarvam"}

        except json.JSONDecodeError as e:
            print(f"[Concept Extraction] JSON parse error: {e}")
            return ConceptExtractor._get_demo_concepts()
        except Exception as e:
            print(f"[Concept Extraction] Error: {e}")
            return ConceptExtractor._get_demo_concepts()
