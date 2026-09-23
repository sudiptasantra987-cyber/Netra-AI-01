from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime
from app.core.database import db
from app.services.doctor_recommender import DOCTORS_DATABASE, BOOKED_SLOTS
from app.models.schema import BookAppointmentRequest, AppointmentRecord, DoctorNotesUpdate

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/book", response_model=AppointmentRecord)
def book_appointment(req: BookAppointmentRequest, patient_id: str = "pat-01", patient_name: str = ""):
    # Find doctor
    doc = None
    for d in DOCTORS_DATABASE:
        if d["id"] == req.doctor_id:
            doc = d
            break
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    slot_key = f"{req.doctor_id}_{req.date}_{req.time_slot}"
    if slot_key in BOOKED_SLOTS:
        raise HTTPException(status_code=409, detail="This consultation slot has just been booked by another patient. Please select an alternate time.")

    # Mark slot as booked
    BOOKED_SLOTS.add(slot_key)

    # Screening context lookup
    screening_summary = None
    if req.screening_id:
        for s in db.data["screenings"]:
            if s["screening_id"] == req.screening_id:
                screening_summary = f"{s['primary_condition']} ({s['risk_level']} - Score: {s['risk_score']})"
                break

    apt_id = f"apt-{uuid.uuid4().hex[:8]}"
    record = {
        "appointment_id": apt_id,
        "patient_id": patient_id,
        "patient_name": patient_name,
        "doctor_id": req.doctor_id,
        "doctor_name": doc["name"],
        "doctor_specialization": doc["specialization"],
        "hospital": doc["hospital"],
        "date": req.date,
        "time_slot": req.time_slot,
        "status": "Confirmed",
        "reason": req.reason,
        "screening_id": req.screening_id,
        "screening_summary": screening_summary,
        "doctor_notes": req.notes,
        "created_at": datetime.now().isoformat()
    }
    db.data["appointments"].append(record)
    db.save()

    return AppointmentRecord(**record)

@router.get("/patient/{patient_id}", response_model=List[AppointmentRecord])
def get_patient_appointments(patient_id: str):
    apts = [a for a in db.data["appointments"] if a["patient_id"] == patient_id]
    return [AppointmentRecord(**a) for a in apts]

@router.get("/doctor/{doctor_id}", response_model=List[AppointmentRecord])
def get_doctor_appointments(doctor_id: str):
    apts = [a for a in db.data["appointments"] if a["doctor_id"] == doctor_id]
    return [AppointmentRecord(**a) for a in apts]

@router.patch("/{appointment_id}/notes", response_model=AppointmentRecord)
def update_doctor_notes(appointment_id: str, payload: DoctorNotesUpdate):
    for a in db.data["appointments"]:
        if a["appointment_id"] == appointment_id:
            a["doctor_notes"] = payload.clinical_remarks
            if payload.diagnosis_confirmed:
                a["status"] = "Completed"
            db.save()
            return AppointmentRecord(**a)
    raise HTTPException(status_code=404, detail="Appointment not found")
