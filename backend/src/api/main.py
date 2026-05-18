from fastapi import FastAPI, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from src.core.orchestrator import ReportOrchestrator
from database import get_db
from models import Report
import shutil
from pathlib import Path
from config.settings import UPLOADS_DIR, PROCESSED_DIR
from fastapi.responses import FileResponse
from pydantic import BaseModel
import datetime

app = FastAPI(title="AI Report Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = ReportOrchestrator()

@app.post("/generate-report")
async def generate_report(
    files: list[UploadFile] = File(...),
    industry: str = Form(...),
    service: str = Form(...),
    project_name: str = Form("Untitled"),
    db: Session = Depends(get_db)
):
    # Save uploaded files
    uploaded_paths = []
    for file in files:
        file_path = UPLOADS_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        uploaded_paths.append(str(file_path))
    
    # Generate report
    params = {"industry": industry, "service": service, "project_name": project_name}
    report_path = orchestrator.generate_full_report(uploaded_paths, params, db)
    
    return {
        "status": "success",
        "report_path": report_path,
        "download_url": f"/download/{Path(report_path).name}"
    }

@app.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "project_name": r.project_name,
            "industry": r.industry,
            "service": r.service,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
            "file_name": Path(r.file_path).name if r.file_path else None,
            "download_url": f"/download/{Path(r.file_path).name}" if r.file_path else None,
        }
        for r in reports
    ]

@app.get("/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "id": r.id,
        "project_name": r.project_name,
        "industry": r.industry,
        "service": r.service,
        "status": r.status,
        "created_at": r.created_at.isoformat(),
        "file_name": Path(r.file_path).name if r.file_path else None,
        "download_url": f"/download/{Path(r.file_path).name}" if r.file_path else None,
    }

@app.get("/download/{filename}")
def download_report(filename: str):
    file_path = PROCESSED_DIR / filename
    if file_path.exists():
        return FileResponse(file_path)
    return {"error": "File not found"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
