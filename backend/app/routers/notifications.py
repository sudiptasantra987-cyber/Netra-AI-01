from fastapi import APIRouter, HTTPException, Depends, Path
from typing import List
from app.core.database import db
from app.routers.auth import get_current_user
from app.models.schema import NotificationItem, NotificationStatusResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationItem])
def get_user_notifications(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    return db.get_notifications(user_id)

@router.patch("/{notification_id}/read", response_model=NotificationStatusResponse)
def mark_notification_as_read(
    notification_id: str = Path(..., description="Notification ID"),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    success = db.mark_notification_read(user_id, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found or unauthorized")
    
    unread = sum(1 for n in db.get_notifications(user_id) if not n.get("is_read"))
    return NotificationStatusResponse(
        success=True,
        message="Notification marked as read",
        unread_count=unread
    )

@router.post("/mark-all-read", response_model=NotificationStatusResponse)
def mark_all_notifications_as_read(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    count = db.mark_all_notifications_read(user_id)
    return NotificationStatusResponse(
        success=True,
        message=f"Marked {count} notifications as read",
        unread_count=0
    )
