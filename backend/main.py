from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
from backend.extractor import extract_courses
from backend.solver import TimetableCSP
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PlanWizz API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PreferenceRequest(BaseModel):
    selected_subjects: List[str]
    courses_data: List[Dict]
    leave_day: str
    preferred_faculties: Optional[Dict[str, str]] = {}

class TextUploadRequest(BaseModel):
    text: str

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")
    
    contents = await file.read()
    try:
        extracted_data = extract_courses(contents)
        return {"courses": extracted_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.post("/api/upload-text")
async def upload_text(request: TextUploadRequest):
    try:
        from backend.extractor import extract_courses_from_text
        extracted_data = extract_courses_from_text(request.text)
        return {"courses": extracted_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process text: {str(e)}")

@app.post("/api/generate")
def generate_timetable(request: PreferenceRequest):
    solver = TimetableCSP(
        request.selected_subjects,
        request.courses_data,
        request.leave_day,
        request.preferred_faculties
    )
    
    result = solver.solve()
    return result

@app.post("/api/check-compatibility")
def check_compatibility(request: PreferenceRequest):
    """
    Returns a list of subjects that CAN be added to the current selection without causing conflict.
    """
    # 1. Deduce all available subjects from the raw data
    all_subjects = list(set(c['course_name'] for c in request.courses_data))
    
    # 2. Identify candidates (subjects not yet selected)
    candidates = [s for s in all_subjects if s not in request.selected_subjects]
    
    compatible_subjects = []
    
    # 3. For each candidate, check if (Selected + Candidate) is solvable
    for cand in candidates:
        temp_selection = request.selected_subjects + [cand]
        
        # Instantiate Solver for this specific combination
        # Note: We pass empty preferred_faculties for this check to be lenient (strict hard constraint check only)
        # OR should we include them? User wants to know if it fits "available options".
        # Let's include them to be accurate to user's current settings.
        solver = TimetableCSP(
            temp_selection,
            request.courses_data,
            request.leave_day,
            request.preferred_faculties
        )
        
        if solver.is_solvable():
            compatible_subjects.append(cand)
            
    return {"compatible_subjects": compatible_subjects}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
