"""
Concept Extraction using Google Gemini
Extracts important concepts from student notes images

Required .env variables:
    GEMINI_API_KEY   your Google Gemini API key
"""
import json
import base64
import os
from io import BytesIO
from PIL import Image
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class ConceptExtractor:
    """Concept extractor using Gemini (with demo mode fallback)"""

    @staticmethod
    def _get_demo_concepts():
        """
        Returns demo/mock concepts for testing when no API credentials are set.
        Includes normalized region coordinates (0.0-1.0) so the image highlighter works.
        """
        return {
            "concepts": [
                {
                    "id": "concept_1",
                    "name": "Photosynthesis",
                    "summary": "Process by which green plants convert sunlight into energy using chlorophyll.",
                    "category": "Biology",
                    "region": {"x1": 0.05, "y1": 0.05, "x2": 0.45, "y2": 0.25}
                },
                {
                    "id": "concept_2",
                    "name": "Chlorophyll",
                    "summary": "Green pigment in plant cells that absorbs sunlight for photosynthesis.",
                    "category": "Biology",
                    "region": {"x1": 0.05, "y1": 0.30, "x2": 0.45, "y2": 0.50}
                },
                {
                    "id": "concept_3",
                    "name": "Glucose",
                    "summary": "A simple sugar produced as the output of photosynthesis, used for plant energy.",
                    "category": "Chemistry",
                    "region": {"x1": 0.05, "y1": 0.55, "x2": 0.45, "y2": 0.75}
                }
            ],
            "source": "demo"
        }

    @staticmethod
    def extract_concepts_from_highlighted_region(image_data, highlight_box=None, use_demo=False):
        """
        Extracts concepts from the image using Gemini 2.5 Flash.
        Returns a dict: {"concepts": [...], "source": "gemini"|"demo"}
        Each concept has: id, name, summary, category, region (normalized x1/y1/x2/y2)
        """
        if use_demo or not GEMINI_API_KEY:
            print("[Concept Extraction] Using demo mode (no API credentials configured)")
            return ConceptExtractor._get_demo_concepts()

        try:
            client = genai.Client(api_key=GEMINI_API_KEY)

            # Decode base64 image
            image = Image.open(BytesIO(base64.b64decode(image_data)))

            # If a highlight box is provided, crop to that region
            if highlight_box:
                cropped = image.crop(highlight_box)
            else:
                cropped = image

            # Convert image to PNG bytes
            buffered = BytesIO()
            cropped.save(buffered, format="PNG")
            img_bytes = buffered.getvalue()

            system_prompt = """You are an expert at extracting key concepts from student notes images.
Analyze the image and identify the main concepts/topics visible in it.
You MUST respond with ONLY a valid JSON array — no markdown, no explanation, just the raw JSON.

Each object in the array must have:
- "id": unique string like "concept_1", "concept_2", etc.
- "name": short concept name (2-5 words)
- "summary": one clear sentence explaining the concept
- "category": subject area (e.g. "Biology", "Math", "Physics", "Chemistry", "History", "General")
- "region": normalized bounding box (values 0.0 to 1.0) where concept appears in the image:
  { "x1": float, "y1": float, "x2": float, "y2": float }
  (x1,y1 = top-left, x2,y2 = bottom-right)

Example:
[
  {
    "id": "concept_1",
    "name": "Newton's Second Law",
    "summary": "Force equals mass times acceleration, describing how objects respond to forces.",
    "category": "Physics",
    "region": {"x1": 0.05, "y1": 0.08, "x2": 0.55, "y2": 0.28}
  }
]
"""

            print("[Concept Extraction] Calling Gemini API...")
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    types.Part.from_bytes(data=img_bytes, mime_type='image/png'),
                    "Extract the main concepts from this student notes image and return them as a JSON array."
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )

            raw_content = response.text.strip()
            print(f"[Concept Extraction] Response received ({len(raw_content)} chars)")

            # Strip markdown code fences if model still wraps the JSON in ```
            if raw_content.startswith("```"):
                lines = raw_content.split("\n")
                # Remove first line (```json or ```) and last line (```)
                raw_content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

            concepts_list = json.loads(raw_content)

            # Ensure all concepts have required fields with fallback defaults
            for i, c in enumerate(concepts_list):
                if "id" not in c:
                    c["id"] = f"concept_{i+1}"
                if "region" not in c:
                    step = 1.0 / max(len(concepts_list), 1)
                    c["region"] = {"x1": 0.0, "y1": i * step, "x2": 1.0, "y2": (i + 1) * step}
                if "category" not in c:
                    c["category"] = "General"
                if "summary" not in c:
                    c["summary"] = c.get("description", "")

            print(f"[Concept Extraction] Extracted {len(concepts_list)} concepts via gemini")
            return {"concepts": concepts_list, "source": "gemini"}

        except json.JSONDecodeError as e:
            print(f"[Concept Extraction] JSON parse error: {e}")
            return ConceptExtractor._get_demo_concepts()
        except Exception as e:
            print(f"[Concept Extraction] Error: {e}")
            return ConceptExtractor._get_demo_concepts()
