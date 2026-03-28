# PlanWizz - Intelligent Timetable Generator

PlanWizz is an advanced scheduling system that uses a Constraint Satisfaction Problem (CSP) solver to generate clash-free student timetables from PDF enrollment data.

## Project Structure

- `backend/`: FastAPI application handling PDF parsing and timetable generation logic.
- `frontend/`: React + Vite application for the user interface.
- `extract_pdf.py`: Standalone utility for PDF data extraction.

## Prerequisites

- Python 3.8+
- Node.js 18+
- npm

## Getting Started

### 1. Backend Setup

Navigate to the project root and install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

Run the backend server from the project root:

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`. You can view the interactive documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup

Navigate to the `frontend` directory and install dependencies:

```bash
cd frontend
npm install
```

Run the frontend development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## Features

- **PDF Parsing**: Automatically extracts course information, slots, and faculty details from PDF files.
- **CSP Solver**: Implements backtracking to find a valid, clash-free schedule based on user-defined preferences.
- **Context-Aware Design**: Handles hard constraints (leave days) and soft constraints (preferred faculty).
- **Responsive UI**: Built with React and Tailwind CSS for a seamless user experience.
- **Searchable Course List**: Easily find subjects by Name or Course Code in the selection menu.

## Deployment

### Deploy on Render

This project is configured for easy deployment on [Render](https://render.com).

1.  **Create a Render Account**: Sign up at https://dashboard.render.com.
2.  **Create a New Blueprint**:
    - Click **New +** -> **Blueprint**.
    - Connect your GitHub repository (`Gurumurthys1/time_table_sec`).
3.  **Auto-Configuration**:
    - Render will automatically detect the `render.yaml` file in the root.
    - It will create two services:
        - **planwiz-backend**: The FastAPI web service.
        - **planwiz-frontend**: The React static site.
4.  **Deploy**: Click **Apply** to start the deployment.

Both services will be deployed. The frontend will automatically know the backend URL via the `VITE_API_URL` environment variable.

#   p l a n w i z z

# SEC-TimeTable
