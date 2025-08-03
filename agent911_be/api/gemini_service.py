import os
from google import genai
from django.conf import settings
import json


def generate_gemini_report(transcript: str, call_metadata: dict) -> dict:
    """
    Sends the transcript and metadata to Gemini API and returns a standardized JSON report.
    """
    prompt = f"""
You are a 911 operator assistant. Format the following call data and transcript into a standard 911 operator report.

Respond ONLY with a valid JSON object in the following format, with all fields filled in. Do NOT use Markdown formatting, code blocks, or triple backticks. Respond ONLY with raw JSON:

{{
  "nature_of_emergency": "",
  "location": "",
  "persons_involved": "",
  "actions_taken": "",
  "units_dispatched": "",
  "outcome_resolution": "",
  "key_events": "",
  "operator_notes": ""
}}

## Call Metadata
Call ID: {call_metadata.get('id')}
Date/Time: {call_metadata.get('start_time')} - {call_metadata.get('end_time')}
Caller Info: {call_metadata.get('caller_info')}
Call Duration: {call_metadata.get('duration')}

## Transcript
{transcript}

Fill in each field based on the transcript and metadata. Do not include any text outside the JSON object.
"""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        print("GEMINI_API_KEY environment variable is missing! Cannot call Gemini API.")
        raise ValueError(
            "GEMINI_API_KEY environment variable is missing! Please set it in your environment or .env file."
        )
    print("Gemini API Key loaded: SET")
    print(f"Prompt for Gemini:\n{prompt}")
    try:
        client = genai.Client(api_key=api_key)
        print("Gemini client initialized.")
        response = client.models.generate_content(
            model="gemini-2.5-pro", contents=prompt
        )
        print(f"Gemini response received: {getattr(response, 'text', str(response))[:500]}")
        # Remove Markdown code block if present
        text = response.text.strip()
        if text.startswith('```json'):
            text = text[len('```json'):].strip()
        if text.startswith('```'):
            text = text[len('```'):].strip()
        if text.endswith('```'):
            text = text[:-3].strip()
        # Try to parse the response as JSON
        try:
            report_json = json.loads(text)
            return report_json
        except Exception as e:
            print(f"Error parsing Gemini response as JSON: {e}")
            return {"error": "Could not parse Gemini response as JSON.", "raw": response.text}
    except Exception as e:
        print(f"Error during Gemini API call: {e}")
        raise
