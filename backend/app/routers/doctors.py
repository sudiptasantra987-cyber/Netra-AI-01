from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from app.services.doctor_recommender import find_and_rank_doctors, get_slots_for_doctor, DOCTORS_DATABASE
from app.models.schema import DoctorProfile, DoctorAvailabilitySlot

router = APIRouter(prefix="/doctors", tags=["Ophthalmologists"])

@router.get("/search", response_model=List[DoctorProfile])
def search_doctors(
    lat: Optional[float] = Query(None, description="Patient latitude"),
    lng: Optional[float] = Query(None, description="Patient longitude"),
    city: Optional[str] = Query(None, description="Filter by Indian city"),
    condition: Optional[str] = Query(None, description="Diagnosed condition to match specialty"),
    date: Optional[str] = Query(None, description="Target consultation date")
):
    results = find_and_rank_doctors(
        user_lat=lat,
        user_lng=lng,
        city_filter=city,
        condition_match=condition,
        query_date=date
    )
    return results

@router.get("/{doc_id}", response_model=DoctorProfile)
def get_doctor(doc_id: str, lat: Optional[float] = None, lng: Optional[float] = None):
    for doc in DOCTORS_DATABASE:
        if doc["id"] == doc_id:
            ranked = find_and_rank_doctors(user_lat=lat, user_lng=lng)
            for r in ranked:
                if r.id == doc_id:
                    return r
    raise HTTPException(status_code=404, detail="Doctor not found")

@router.get("/{doc_id}/slots", response_model=List[DoctorAvailabilitySlot])
def get_doctor_slots(doc_id: str, date: str = Query(..., description="Date YYYY-MM-DD")):
    return get_slots_for_doctor(doc_id, date)
