<div align="center">
  <img src="planwizz_banner.png" alt="PlanWizz Banner" width="100%">
  
  <h1>🎓 PlanWizz - Intelligent Timetable Generator</h1>
  <p><strong>A Constraint Satisfaction Problem (CSP) solver built to generate clash-free student timetables from PDF enrollment data.</strong></p>

  <p>
    <a href="https://planwizzz.onrender.com/"><strong>🟢 Live Project Link - Try It Now!</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/Deployment-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render">
  </p>
</div>

---

## 🚀 Overview

**PlanWizz** (SEC-TimeTable) is an advanced and intuitive scheduling system designed to make academic timetable generation effortless. By parsing raw PDF enrollment data and applying advanced CSP algorithms, it ensures zero time clashes while respecting both strict requirements and soft preferences.

## ✨ Key Features

- 📄 **Smart PDF Parsing**: Automatically extracts course information, available slots, and faculty details from structured PDF files.
- 🧠 **Advanced CSP Solver**: Implements a robust backtracking algorithmic engine to find a perfectly valid, clash-free schedule.
- ⚙️ **Context-Aware Design**: Handles hard constraints (like specific leave days) and soft constraints (like preferred faculty or time ranges).
- 🎨 **Responsive UI**: A beautiful, minimalist frontend built with React and Tailwind CSS for a seamless user experience.
- 🔍 **Searchable Course List**: Easily find specific subjects by Name or Course Code in the selection menu.

## 🛠 Project Structure

The repository is modular and split into two core environments:

- 📂 `backend/`: FastAPI application containing all PDF parsing logic and the CSP timetabling engine.
- 📂 `frontend/`: React + Vite web application containing the user interface.
- 📄 `extract_pdf.py`: Standalone Python utility dedicated purely to PDF data extraction.

## 🚦 Getting Started

### Prerequisites

Ensure you have the following installed before proceeding:
- **Python 3.8+**
- **Node.js 18+**
- **npm** (Node Package Manager)

### 1️⃣ Backend Setup

Open a terminal at the root of the project to initialize the API:

```bash
# Install backend dependencies
pip install -r backend/requirements.txt

# Start the backend server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
> The API will run at `http://localhost:8000`
> *Interactive API Documentation available at `http://localhost:8000/docs`*

### 2️⃣ Frontend Setup

In a new terminal, navigate to the frontend directory:

```bash
# Enter the frontend folder
cd frontend

# Install necessary modules
npm install

# Start the Vite development server
npm run dev
```
> The frontend application will be accessible at `http://localhost:5173`

---

## ☁️ Deployment (Render)

This project is fully configured for automated deployment securely on [Render](https://render.com).

1. **Create a Render Account**: Sign up at Render Dashboard.
2. **Create a New Blueprint**:
   - Go to **New +** > **Blueprint**.
   - Connect this GitHub repository.
3. **Auto-Configuration**:
   - Render automatically detects the `render.yaml` file in the root directory.
   - It will spin up two services: `planwiz-backend` (FastAPI) and `planwiz-frontend` (React static site).
4. **Deploy**: Click **Apply** to complete the deployment.

*(The frontend automatically detects the deployed backend URL via the `VITE_API_URL` environment variable).*

---
<div align="center">
  <sub>Built with ❤️ | SEC-TimeTable</sub>
</div>
