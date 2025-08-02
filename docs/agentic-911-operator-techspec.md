# Agentic 911 Operator Automation - Technical Specification

## 1. Overview

This document provides a detailed technical design and implementation plan for the Agentic 911 Operator Automation platform, as specified in the `agentic-911-operator-prd.md`. The goal is to create a robust, scalable, and secure web application that automates tedious tasks for 911 operators.

The implementation will be broken down into logical, sequential steps suitable for an LLM-based development agent.

## 2. High-Level Architecture

The system will be built using a modern web stack:

-   **Frontend:** A single-page application (SPA) built with **React** and **TypeScript**.
-   **Backend:** A RESTful API server built with **Django** and **Django Rest Framework (DRF)**.
-   **Real-time Communication:** **Django Channels** will be used to manage WebSocket connections for live features like transcription and notifications.
-   **Database:** **PostgreSQL** will be the relational database, managed by the Django ORM.
-   **Deployment:** The application will be containerized using **Docker** for consistency across development, testing, and production environments.

## 3. Assumptions

-   **Authentication:** The system will use token-based authentication (JWT) for securing API endpoints.
-   **Third-Party APIs:** Access to a Computer-Aided Dispatch (CAD) system, a telephony system, and **Cartesia** for real-time Speech-to-Text (STT) and Text-to-Speech (TTS) is available. The backend will proxy all Cartesia API requests to keep credentials secure and centralize error handling. The frontend will stream audio and text to the backend, which manages Cartesia WebSocket/HTTP connections. Real-time transcripts will be stored in the database as they arrive, with a final transcript flag. This specification will define the integration points, but not the implementation details of the external services themselves.
-   **Initial Scope:** The initial implementation will focus on the core features outlined in the PRD. The platform will be designed for extensibility.

## 4. Database Schema Design

The following tables will be created using Django models.

-   **`User` (extends Django's AbstractUser):**
    -   `role`: (Operator, Supervisor, Admin) - for role-based access control (RBAC).
-   **`Call`:**
    -   `caller_info`: (e.g., phone number, name).
    -   `start_time`, `end_time`.
    -   `status`: (Active, Completed, Archived).
    -   `type`: (Emergency, Non-Emergency).
    -   `operator_id`: Foreign Key to `User`.
-   **`CallTranscript`:**
    -   `call_id`: Foreign Key to `Call`.
    -   `timestamp`: The time of the transcript entry.
    -   `text`: The transcribed text segment.
    -   `speaker`: (Caller, Agent, Operator).
-   **`Form`:**
    -   `name`: (e.g., "Incident Report", "Medical Emergency").
    -   `template_schema`: A JSON field defining the form structure.
-   **`CallForm`:**
    -   `call_id`: Foreign Key to `Call`.
    -   `form_id`: Foreign Key to `Form`.
    -   `status`: (Pending, Pre-filled, Submitted, Error).
    -   `form_data`: A JSON field containing the filled-out data.
    -   `submitted_by`: Foreign Key to `User`.
-   **`AuditLog`:**
    -   `user_id`: Foreign Key to `User`.
    -   `action`: (e.g., "LOGIN", "FORM_SUBMIT", "CALL_ARCHIVE").
    -   `timestamp`.
    -   `details`: A JSON field with context about the action.
-   **`ConversationRoom`:**
    -   `room_id`: A unique identifier (e.g., UUID).
    -   `call_id`: Foreign Key to `Call`.
    -   `operator_id`: Foreign Key to `User`.
    -   `status`: (Active, Closed).

## 5. Backend (Django) Implementation Plan

### Step 1: Project Setup
-   Initialize a new Django project.
-   Create a new Django app named `api`.
-   Install necessary packages: `djangorestframework`, `django-cors-headers`, `djangochannels`, `daphne`, `psycopg2-binary`, `pyjwt`.
-   Configure `settings.py` for the database (PostgreSQL), installed apps, CORS headers, and DRF (specifying JWT for authentication).
-   Set up Django Channels for WebSocket handling.

### Step 2: Models and Migrations
-   Implement the database tables defined in section 4 as Django models in `api/models.py`.
-   Generate and run database migrations.

### Step 3: API Endpoint Design (Django Rest Framework)
-   **Authentication (`/api/auth/`):**
    -   `POST /api/auth/token/`: User login, returns JWT access and refresh tokens.
    -   `POST /api/auth/token/refresh/`: Refreshes the access token.
    -   `GET /api/auth/user/`: Retrieves the current user's details.
-   **Calls (`/api/calls/`):**
    -   `GET /`: List and filter calls.
    -   `POST /`: Create a new call record.
    -   `GET /{id}/`: Retrieve details for a single call.
    -   `GET /{id}/transcripts/`: Get all transcript segments for a call.
    -   `GET /{id}/forms/`: Get all forms associated with a call.
-   **Forms (`/api/forms/`):**
    -   `GET /`: List available form templates.
    -   `POST /call-forms/`: Create a new call form instance.
    -   `PUT /call-forms/{id}/`: Update a call form (review, edit, submit).
-   **Real-time (WebSocket):**
    -   `ws/calls/{call_id}/`: A WebSocket endpoint for a specific call.
        -   **Client-to-Server:** Send live audio chunks.
        -   **Server-to-Client:** Broadcast new transcript segments, form autofill updates, and status changes.

### Step 4: Business Logic
-   **Serializers:** Create DRF serializers for all models to control API representation.
-   **Views:** Implement API views (ViewSets) for each endpoint.
-   **Permissions:** Implement custom DRF permissions for RBAC (e.g., only Supervisors can view analytics).
-   **Consumers:** Implement Django Channels consumers to handle WebSocket connections, receive audio data, and broadcast updates.
-   **Integrations:** Create a `services` module to encapsulate logic for interacting with third-party APIs (CAD, Cartesia for STT/TTS).

## 6. Frontend (React) Implementation Plan

### Step 1: Project Setup
-   Initialize a new React project using Create React App with the TypeScript template.
-   Install necessary packages: `axios`, `react-router-dom`, `redux-toolkit`, `react-redux`, `@emotion/react`, `@emotion/styled`, `@mui/material`.
-   Set up a directory structure: `components/`, `pages/`, `services/`, `store/`, `hooks/`.

### Step 2: Core UI Components
-   **Layout:** `Sidebar`, `Header`, `MainContent` for the main application shell.
-   **Authentication:** `LoginPage`, `AuthGuard` (a wrapper to protect routes).
-   **Dashboard:** `DashboardPage` containing widgets for `RecentCalls`, `TaskStatus`, and `Notifications`.
-   **Call Management:** `CallListPage`, `CallDetailView`, `CallFilterControls`.
-   **Conversation/Live Call:** `ConversationRoomPage` which includes:
    -   `LiveTranscriptDisplay`: Shows real-time transcriptions.
    -   `AudioVisualizer`: Indicates live audio status.
    -   `DynamicForm`: Renders and manages the auto-filling form.
-   **UI Library:** Use Material-UI (MUI) to build a professional, accessible, and responsive UI that meets WCAG 2.1 AA standards.

### Step 3: State Management (Redux Toolkit)
-   **Auth Slice:** Manages user authentication state, token, and user info.
-   **Calls Slice:** Manages the list of calls, active call details, and transcripts.
-   **Forms Slice:** Manages form templates and data for the active call.
-   **UI Slice:** Manages global UI state like notifications and loading indicators.

### Step 4: Client-Side Logic
-   **API Service:** Create an `api.js` module using Axios to handle all HTTP requests to the Django backend. It should include an interceptor to attach the JWT token to headers.
-   **WebSocket Service:** Create a `websocket.js` service to manage WebSocket connections. It will connect to the Django Channels endpoint and dispatch Redux actions upon receiving messages.
-   **Routing:** Use `react-router-dom` to define routes for all pages.
-   **Hooks:** Create custom hooks (`useAuth`, `useCalls`) to simplify component logic.

## 7. Step-by-Step Implementation Guide

1.  **Foundation (Backend):**
    -   Set up the Django project and `api` app.
    -   Define all models in `api/models.py` and run migrations.
    -   Implement JWT authentication endpoints.
2.  **Foundation (Frontend):**
    -   Set up the React project with TypeScript.
    -   Implement the login page and authentication state management (Redux).
    -   Set up basic routing and protected routes.
3.  **Core Feature - Call & Form Management (CRUD):**
    -   **Backend:** Create serializers and ViewSets for `Call` and `CallForm` models.
    -   **Frontend:** Build the `DashboardPage` to display a list of recent calls.
    -   **Frontend:** Build the `CallDetailView` to show call information and associated forms.
    -   **Frontend:** Implement functionality to review, edit, and submit forms.
4.  **Real-time Feature - Live Call Handling:**
    -   **Backend:** Implement the WebSocket consumer (`CallConsumer`) in Django Channels. This consumer will handle incoming audio data and broadcast transcript/form updates.
    -   **Backend:** Integrate the Cartesia STT service. When audio is received, send it to the Cartesia API and get a transcript back.
    -   **Backend:** Implement logic to parse transcripts and auto-fill form data. Broadcast updates to the room.
    -   **Frontend:** Build the `ConversationRoomPage`.
    -   **Frontend:** Implement the WebSocket client to connect to the `CallConsumer`, send audio, and receive real-time updates for the transcript and form.
5.  **Supporting Features:**
    -   **Backend:** Implement audit logging using Django signals or middleware.
    -   **Backend:** Create API endpoints for reporting and analytics, accessible only to supervisors/admins.
    -   **Frontend:** Build the reporting and analytics dashboard.
    -   **Frontend:** Implement a global notification system.
6.  **Code Quality and Finalization:**
    -   **Both:** Set up ESLint (frontend) and Black/Flake8 (backend) with pre-commit hooks to enforce code style.
    -   **Both:** Write unit and integration tests for critical business logic and API endpoints.
    -   **CI/CD:** Create a CI pipeline (e.g., using GitHub Actions) that runs linters and tests on every push.
    -   **Deployment:** Write `Dockerfile` and `docker-compose.yml` files to containerize the frontend and backend applications for deployment.
