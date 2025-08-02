# Agentic 911 Operator Automation - Minimal Prototype Technical Specification

## 1. Overview

This document provides a streamlined technical design for a hackathon prototype of the Agentic 911 Operator Automation platform. The goal is to build a functional proof-of-concept demonstrating the core feature: **real-time call transcription using Cartesia STT**.

This spec focuses on the minimal viable product (MVP) to be completed within a limited timeframe.

## 2. High-Level Architecture


   **Audio Upload & Transcription:** Batch HTTP endpoint for audio upload and transcription.

## 3. Core Feature: Batch Transcription

The MVP now demonstrates the following workflow:
1.  A user (operator) starts a "call" in the frontend UI (no authentication required).
2.  The frontend captures microphone audio and, after recording, uploads the audio file to the backend via an HTTP POST request.
3.  The backend receives the audio file and sends it to Cartesia's STT batch HTTP endpoint (`POST https://api.cartesia.ai/stt`) with the required API key and model.
4.  When Cartesia returns the transcript, the backend saves it to the database and returns it to the frontend.
5.  The frontend displays the transcript after processing is complete.

## 4. Database Schema Design (Minimal)

-   **`Call`:**
    -   `start_time`: DateTimeField
    -   `caller_info`: CharField (optional, for display)
-   **`CallTranscript`:**
    -   `call`: ForeignKey to `Call`
    -   `timestamp`: DateTimeField
    -   `text`: TextField
    -   `is_final`: BooleanField

## 5. Backend (Django) Implementation Plan

### Step 1: Project Setup
-   Initialize a new Django project and an `api` app.
-   Install packages: `djangorestframework`, `django-cors-headers`, `djangochannels`, `daphne`, `websockets` (for connecting to Cartesia).
-   Configure `settings.py` for SQLite, installed apps, CORS, and Channels.
-   No authentication required; single user for demo.

### Step 2: Models and Migrations
-   Implement the `Call` and `CallTranscript` models in `api/models.py`.
-   Generate and run database migrations.

### Step 3: API Endpoints (Minimal)
-   `POST /api/calls/`: Creates a new call record and returns its ID.
-   `GET /api/calls/`: Lists all past calls.
-   `GET /api/calls/{id}/transcripts/`: Retrieves all transcripts for a specific call.

### Step 4: Batch Transcription Endpoint
-   Path: `POST /api/calls/{call_id}/transcribe/`
-   Accepts an audio file upload (multipart/form-data) from the frontend.
-   Forwards the audio file to Cartesia's batch HTTP endpoint (`POST https://api.cartesia.ai/stt`).
-   Receives the transcript from Cartesia, saves it to the `CallTranscript` model, and returns it to the frontend.

## 6. Frontend (React/Next.js) Implementation Plan

### Step 1: Project Setup
-   Initialize a new Next.js project (App Router).
-   Install packages: `axios`, `@mui/material`.

### Step 2: Core UI Components
-   `DashboardPage`:
    -   A button to "Start New Call" which makes a `POST` request to `/api/calls/`.
    -   A list of past calls.
-   `ConversationRoomPage`:
    -   Displays the `call_id`.
    -   Buttons to "Start Recording" and "Stop Recording".
    -   After recording, uploads the audio file to `/api/calls/{call_id}/transcribe/`.
    -   Displays the transcript after processing is complete.

### Step 3: Client-Side Logic
-   **API Service:** A simple module using `axios` for HTTP requests, including audio upload and transcript retrieval.
-   **Audio Recording:** Uses `navigator.mediaDevices.getUserMedia` and `MediaRecorder` to record audio and save as a file.
-   **Batch Upload:** On "Stop Recording", uploads the audio file to the backend for transcription.
-   **Transcript Display:** Updates the UI with the returned transcript after processing.

## 7. Out of Scope for Hackathon Prototype
-   User Authentication (JWT)
-   Role-Based Access Control (RBAC)
-   Form Filling and Automation
-   TTS Integration
-   Advanced Dashboards, Reporting, and Analytics
-   Notifications, Audit Logging
-   Containerization (Docker) and Production Deployment
