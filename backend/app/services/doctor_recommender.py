import math
from typing import List, Optional, Dict
from app.models.schema import DoctorProfile, DoctorAvailabilitySlot

# Pre-seeded verified Indian Ophthalmologists and specialized eye institutes
DOCTORS_DATABASE: List[Dict] = [
    {
        "id": "doc-01",
        "name": "Dr. Ananya Sengupta",
        "degrees": "MBBS, MS (Ophthalmology), FRCS (Glasgow)",
        "specialization": "Vitreo-Retinal Surgeon & Diabetic Eye Specialist",
        "hospital": "Sankara Nethralaya",
        "city": "Kolkata",
        "address": "147, Barakhola, Mukundapur, EM Bypass, Kolkata, West Bengal 700099",
        "latitude": 22.4965,
        "longitude": 88.3986,
        "experience_years": 16,
        "consultation_fee": 900,
        "rating": 4.9,
        "review_count": 312,
        "is_verified": True,
        "image_avatar": "https://images.unsplash.com/photo-1594824813689-ff80d0d82992?w=150&auto=format&fit=crop&q=80"
    },
    {
        "id": "doc-02",
        "name": "Dr. Rajeshwar Sharma",
        "degrees": "MBBS, MD (AIIMS), DNB (Ophth)",
        "specialization": "Glaucoma Specialist & Anterior Segment Surgeon",
        "hospital": "Dr. Rajendra Prasad Centre for Ophthalmic Sciences, AIIMS",
        "city": "New Delhi",
        "address": "Ansari Nagar, New Delhi, Delhi 110029",
        "latitude": 28.5672,
        "longitude": 77.2100,
        "experience_years": 21,
        "consultation_fee": 1100,
        "rating": 4.95,
        "review_count": 520,
        "is_verified": True,
        "image_avatar": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
    },
    {
        "id": "doc-03",
        "name": "Dr. Priya Sundaram",
        "degrees": "MBBS, MS (Ophth), Fellow Cornea & Cataract (LVPEI)",
        "specialization": "Cataract, Cornea & Refractive Surgeon",
        "hospital": "Narayana Nethralaya Eye Institute",
        "city": "Bengaluru",
        "address": "121/C, 1st R Block, Rajajinagar, Bengaluru, Karnataka 560010",
        "latitude": 12.9902,
        "longitude": 77.5532,
        "experience_years": 14,
        "consultation_fee": 850,
        "rating": 4.88,
        "review_count": 280,
        "is_verified": True,
        "image_avatar": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80"
    },
    {
        "id": "doc-04",
        "name": "Dr. Vikram K. Natarajan",
        "degrees": "MBBS, MS, Fellowship in Vitreo-Retina (Aravind Eye)",
        "specialization": "Medical Retina & Macular Degeneration Specialist",
        "hospital": "Aravind Eye Hospital",
        "city": "Chennai",
        "address": "1, Poonamallee High Road, Noombal, Chennai, Tamil Nadu 600077",
        "latitude": 13.0674,
        "longitude": 80.1448,
        "experience_years": 18,
        "consultation_fee": 750,
        "rating": 4.92,
        "review_count": 440,
        "is_verified": True,
        "image_avatar": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80"
    },
    {
        "id": "doc-05",
        "name": "Dr. Meenakshi Joshi",
        "degrees": "MBBS, DNB (Ophthalmology), FICO (UK)",
        "specialization": "Comprehensive Ophthalmologist & Pediatric Care",
        "hospital": "Aditya Jyot Eye Hospital",
        "city": "Mumbai",
        "address": "Plot No. 153, Major Parameshwaran Road, Wadala, Mumbai 400031",
        "latitude": 19.0176,
        "longitude": 72.8561,
        "experience_years": 12,
        "consultation_fee": 1000,
        "rating": 4.85,
        "review_count": 195,
        "is_verified": True,
        "image_avatar": "https://images.unsplash.com/photo-1594824813689-ff80d0d82992?w=150&auto=format&fit=crop&q=80"
    },
    {
        "id": "doc-06",
        "name": "Dr. Rohan Mukherjee",
        "degrees": "MBBS, MS (Ophthalmology), Fellow LVPEI",
        "specialization": "Retina & Vitreous Consultant",
        "hospital": "Disha Eye Hospitals",
        "city": "Kolkata",
        "address": "88 (63A) Ghoshpara Road, Barrackpore, Kolkata 700120",
        "latitude": 22.7565,
        "longitude": 88.3586,
        "experience_years": 15,
        "consultation_fee": 700,
        "rating": 4.87,
        "review_count": 360,
        "is_verified": True,
        "image_avatar": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80"
    },
    {
        "id": "doc-07",
        "name": "Dr. Sameer Al-Hassan",
        "degrees": "MBBS, MD, Fellowship in Glaucoma (Moorfields)",
        "specialization": "Glaucoma Specialist & Advanced Laser Surgery",
        "hospital": "LV Prasad Eye Institute",
        "city": "Hyderabad",
        "address": "Kallam Anji Reddy Campus, Banjara Hills, Hyderabad, Telangana 500034",
        "latitude": 17.4243,
        "longitude": 78.4312,
        "experience_years": 22,
        "consultation_fee": 1200,
        "rating": 4.96,
        "review_count": 610,
        "is_verified": True,
        "image_avatar": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80"
    }
]

# Track booked slots in-memory / database
BOOKED_SLOTS: set = set()

def get_combined_doctors() -> List[Dict]:
    """Combines pre-seeded ophthalmology centers with verified registered doctor accounts"""
    combined = [dict(d) for d in DOCTORS_DATABASE]
    try:
        from app.core.database import db
        all_users = db.get_users()
        for u in all_users:
            if u.get("role") == "doctor" and u.get("status") != "inactive":
                doc_id = u.get("id")
                if not any(d["id"] == doc_id for d in combined):
                    city = u.get("city") or "Kolkata"
                    hospital = u.get("hospital") or "Netra AI Tele-Clinic Hub"
                    spec = u.get("specialization") or "Comprehensive Eye Specialist"
                    combined.append({
                        "id": doc_id,
                        "name": u.get("name") or "Specialist Doctor",
                        "degrees": u.get("qualifications") or "MBBS, MS (Ophthalmology)",
                        "specialization": spec,
                        "hospital": hospital,
                        "city": city,
                        "address": u.get("address") or f"{hospital}, {city}",
                        "latitude": 22.5726 if city.lower() == "kolkata" else 28.6139,
                        "longitude": 88.3639 if city.lower() == "kolkata" else 77.2090,
                        "experience_years": 12,
                        "consultation_fee": 800,
                        "rating": 4.9,
                        "review_count": 160,
                        "is_verified": u.get("verification_status") == "verified",
                        "image_avatar": u.get("profile_picture") or "https://images.unsplash.com/photo-1594824813689-ff80d0d82992?w=150&auto=format&fit=crop&q=80"
                    })
    except Exception:
        pass
    return combined

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two geo-coordinates"""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def get_slots_for_doctor(doc_id: str, date_str: str) -> List[DoctorAvailabilitySlot]:
    """Generates standard consultation slots for a doctor on a given date"""
    times = [
        "09:30 AM", "10:15 AM", "11:00 AM", "11:45 AM",
        "02:00 PM", "02:45 PM", "03:30 PM", "04:15 PM", "05:00 PM"
    ]
    slots = []
    for t in times:
        slot_key = f"{doc_id}_{date_str}_{t}"
        is_avail = slot_key not in BOOKED_SLOTS
        slots.append(DoctorAvailabilitySlot(
            slot_id=slot_key,
            date=date_str,
            time=t,
            is_available=is_avail
        ))
    return slots

def find_and_rank_doctors(
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    city_filter: Optional[str] = None,
    condition_match: Optional[str] = None,
    query_text: Optional[str] = None,
    query_date: Optional[str] = None
) -> List[DoctorProfile]:
    import datetime
    today = query_date or datetime.date.today().isoformat()
    
    # Default coordinates fallback: central Delhi if not provided
    center_lat = user_lat if user_lat is not None else 28.6139
    center_lng = user_lng if user_lng is not None else 77.2090
    
    all_doctors = get_combined_doctors()
    ranked_results = []
    
    clean_q = (query_text or "").strip().lower()
    
    for doc in all_doctors:
        # Distance calculation
        dist = calculate_haversine_distance(center_lat, center_lng, doc["latitude"], doc["longitude"])
        
        # If user selected a specific city, allow filtering
        if city_filter and city_filter.lower() != "all":
            c_filter = city_filter.lower()
            d_city = doc.get("city", "").lower()
            d_addr = doc.get("address", "").lower()
            if c_filter not in d_city and c_filter not in d_addr:
                # If explicit city query without coords, apply strict filtering
                if user_lat is None:
                    continue

        # Free-text keyword filter/boost if provided
        query_boost = 0.0
        if clean_q and clean_q not in ["all", "doctor", "doctors"]:
            q_terms = [t for t in clean_q.split() if t not in ["in", "near", "me", "find", "eye", "specialist"]]
            doc_text = f"{doc.get('name', '')} {doc.get('specialization', '')} {doc.get('hospital', '')} {doc.get('city', '')} {doc.get('address', '')}".lower()
            if q_terms:
                matched_terms = [t for t in q_terms if t in doc_text]
                if not matched_terms:
                    # If neither name nor city nor hospital matches, don't drop completely unless strictly searching city
                    query_boost = -15.0
                else:
                    query_boost = len(matched_terms) * 12.0

        # Condition relevance score
        spec_match = 1.0
        if condition_match and condition_match.lower() != "all":
            cond_lower = condition_match.lower()
            spec_lower = doc["specialization"].lower()
            if ("retin" in cond_lower or "dr" in cond_lower) and ("retin" in spec_lower or "diabetic" in spec_lower or "macular" in spec_lower):
                spec_match = 2.5
            elif "glauc" in cond_lower and "glauc" in spec_lower:
                spec_match = 2.5
            elif "cataract" in cond_lower and "cataract" in spec_lower:
                spec_match = 2.5
            elif "comprehensive" in spec_lower or "general" in spec_lower:
                spec_match = 1.5
                    
        # Multi-factor intelligent ranking:
        # Score = (1 / (1 + distance_in_km * 0.05)) * 40 + (rating * 8) + (spec_match * 15) + (experience * 0.5) + query_boost
        proximity_factor = 1.0 / (1.0 + (dist * 0.03))
        match_score = round(
            (proximity_factor * 45.0) +
            (doc["rating"] * 6.0) +
            (spec_match * 18.0) +
            (min(20, doc["experience_years"]) * 0.5) +
            query_boost,
            1
        )
        
        slots = get_slots_for_doctor(doc["id"], today)
        
        ranked_results.append(DoctorProfile(
            id=doc["id"],
            name=doc["name"],
            degrees=doc["degrees"],
            specialization=doc["specialization"],
            hospital=doc["hospital"],
            city=doc["city"],
            address=doc["address"],
            latitude=doc["latitude"],
            longitude=doc["longitude"],
            experience_years=doc["experience_years"],
            consultation_fee=doc["consultation_fee"],
            rating=doc["rating"],
            review_count=doc["review_count"],
            is_verified=doc["is_verified"],
            image_avatar=doc["image_avatar"],
            distance_km=dist,
            match_score=match_score,
            available_slots=slots
        ))
        
    # Sort by match score descending
    ranked_results.sort(key=lambda x: x.match_score if x.match_score else 0, reverse=True)
    return ranked_results
