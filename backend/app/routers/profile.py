from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.core.database import db
from app.routers.auth import get_current_user
from app.models.schema import UserProfileUpdate, UserProfileResponse

router = APIRouter(prefix="/profile", tags=["User Profile"])

@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    profile = db.get_profile(user_id)
    if not profile:
        profile = db.create_profile(user_id, {
            "full_name": current_user.get("name", ""),
            "gender": current_user.get("gender", ""),
            "city": current_user.get("city", "")
        })
    
    return UserProfileResponse(
        user_id=user_id,
        full_name=profile.get("full_name") or current_user.get("name", ""),
        email=current_user.get("email", ""),
        phone=current_user.get("phone", ""),
        role=current_user.get("role", "patient"),
        profile_picture=profile.get("profile_picture", ""),
        date_of_birth=profile.get("date_of_birth", ""),
        gender=profile.get("gender") if profile.get("gender") is not None else (current_user.get("gender") or ""),
        address=profile.get("address", ""),
        city=profile.get("city") if profile.get("city") is not None else (current_user.get("city") or ""),
        state=profile.get("state", ""),
        pin_code=profile.get("pin_code", ""),
        bio=profile.get("bio", ""),
        created_at=profile.get("created_at"),
        updated_at=profile.get("updated_at")
    )

@router.put("/me", response_model=UserProfileResponse)
def update_my_profile(req: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    update_data = req.model_dump(exclude_unset=True)
    updated_profile = db.update_profile(user_id, update_data)
    
    # When user updates their profile details, automatically mark the profile_completion notification as read
    db.mark_profile_completion_read(user_id)
    
    # Reload user in case name was updated
    refreshed_user = next((u for u in db.data.get("users", []) if u.get("id") == user_id), current_user)
    
    return UserProfileResponse(
        user_id=user_id,
        full_name=updated_profile.get("full_name") or refreshed_user.get("name", ""),
        email=refreshed_user.get("email", ""),
        phone=refreshed_user.get("phone", ""),
        role=refreshed_user.get("role", "patient"),
        profile_picture=updated_profile.get("profile_picture", ""),
        date_of_birth=updated_profile.get("date_of_birth", ""),
        gender=updated_profile.get("gender") if updated_profile.get("gender") is not None else (refreshed_user.get("gender") or ""),
        address=updated_profile.get("address", ""),
        city=updated_profile.get("city") if updated_profile.get("city") is not None else (refreshed_user.get("city") or ""),
        state=updated_profile.get("state", ""),
        pin_code=updated_profile.get("pin_code", ""),
        bio=updated_profile.get("bio", ""),
        created_at=updated_profile.get("created_at"),
        updated_at=updated_profile.get("updated_at")
    )
