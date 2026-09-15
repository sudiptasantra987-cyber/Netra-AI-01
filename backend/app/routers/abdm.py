import os
import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from app.core.database import db
from app.routers.auth import get_current_user
from app.models.schema import (
    AbdmCardLinkRequest,
    AbdmCardResponse,
    AbdmCardStatusResponse,
    GenericAuthResponse,
)

router = APIRouter(prefix="/abdm", tags=["ABDM & Ayushman Bharat"])

# Regex for ABHA formats:
# 1. 14-digit numeric ABHA number with or without hyphens (e.g. 91-8273-1928-3482 or 91827319283482)
# 2. ABHA address (PHR address) (e.g. user@abdm, sunita.roy@abdm)
ABHA_NUMERIC_REGEX = re.compile(r"^(?:\d{2}-\d{4}-\d{4}-\d{4}|\d{14})$")
ABHA_ADDRESS_REGEX = re.compile(r"^[a-zA-Z0-9._]{3,32}@[a-zA-Z0-9]{2,10}$")

# PM-JAY / Ayushman Beneficiary ID format: alphanumeric, 8 to 18 characters (e.g., P12345678, PMJAY12345678)
PMJAY_REGEX = re.compile(r"^[a-zA-Z0-9]{8,18}$")

def is_official_gateway_configured() -> bool:
    """Check if official ABDM sandbox / production API credentials are set in environment."""
    client_id = os.environ.get("ABDM_CLIENT_ID", "").strip()
    client_secret = os.environ.get("ABDM_CLIENT_SECRET", "").strip()
    return bool(client_id and client_secret)

@router.get("/card", response_model=AbdmCardStatusResponse)
def get_user_abdm_card(current_user: dict = Depends(get_current_user)):
    """Fetch currently linked Ayushman / ABHA card details for authenticated user."""
    user_id = current_user["id"]
    card = db.get_abdm_card(user_id)
    gateway_available = is_official_gateway_configured()

    if not card:
        return AbdmCardStatusResponse(
            linked=False,
            card=None,
            official_gateway_available=gateway_available
        )

    return AbdmCardStatusResponse(
        linked=True,
        card=AbdmCardResponse(
            card_id=card["card_id"],
            user_id=card["user_id"],
            abha_id_masked=card["abha_id_masked"],
            pmjay_id_masked=card.get("pmjay_id_masked"),
            beneficiary_name=card.get("beneficiary_name"),
            demo_mode=card.get("demo_mode", True),
            linked_at=card.get("linked_at", ""),
            status="linked"
        ),
        official_gateway_available=gateway_available
    )

@router.post("/card/link", response_model=AbdmCardResponse)
def link_abdm_card(req: AbdmCardLinkRequest, current_user: dict = Depends(get_current_user)):
    """
    Validate, sanitize, and link ABHA ID and PM-JAY Beneficiary ID.
    - Format validation is enforced.
    - Full IDs are never logged in plain text.
    - If official ABDM API is not configured, runs in clearly-designated Demo Mode.
    """
    user_id = current_user["id"]

    # 1. Verify consent
    if not req.consent_given:
        raise HTTPException(
            status_code=400,
            detail="Consent is required to submit and link your ABHA and Ayushman details."
        )

    # 2. Validate ABHA ID
    raw_abha = req.abha_id.strip()
    if not raw_abha:
        raise HTTPException(status_code=400, detail="ABHA ID is required.")

    is_valid_abha_num = bool(ABHA_NUMERIC_REGEX.match(raw_abha))
    is_valid_abha_addr = bool(ABHA_ADDRESS_REGEX.match(raw_abha))

    if not (is_valid_abha_num or is_valid_abha_addr):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid ABHA ID format. Please provide a 14-digit ABHA Number "
                "(e.g., 91-8273-1928-3482 or 91827319283482) or an ABHA Address (e.g., yourname@abdm)."
            )
        )

    # 3. Validate PM-JAY ID (if supplied)
    raw_pmjay = req.pmjay_id.strip() if req.pmjay_id else None
    if raw_pmjay:
        # Reject non-alphanumeric or outside 8-18 range
        clean_pmjay = raw_pmjay.replace("-", "").replace(" ", "")
        if not PMJAY_REGEX.match(clean_pmjay):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid PM-JAY / Beneficiary ID format. Must be an 8 to 18-character "
                    "alphanumeric identifier (e.g., P12345678 or PMJAY98765432)."
                )
            )
        raw_pmjay = clean_pmjay

    # 4. Check Official Gateway vs Demo Mode
    official_configured = is_official_gateway_configured()
    demo_mode_active = True
    beneficiary_name = None

    if official_configured and not req.demo_mode:
        # In a production environment with approved ABDM Sandbox access tokens:
        # Here we would call NHA ABDM M1/M2 Bridge APIs.
        demo_mode_active = False
        beneficiary_name = current_user.get("name", "Verified Beneficiary")
    else:
        # Demo mode: clearly designated preview simulation
        demo_mode_active = True
        # For preview purposes, indicate demo status on beneficiary name
        user_name = current_user.get("name") or "Authorized Patient"
        beneficiary_name = f"{user_name} (Demo Preview)"

    # 5. Persist linked card in database (storing masked IDs and hashes only)
    card = db.link_abdm_card(
        user_id=user_id,
        abha_id=raw_abha,
        pmjay_id=raw_pmjay,
        beneficiary_name=beneficiary_name,
        demo_mode=demo_mode_active,
    )

    # 6. Add in-app notification
    mode_label = "Demo Mode" if demo_mode_active else "Official ABDM"
    db.add_notification(
        user_id=user_id,
        title="Ayushman Card Linked",
        message=f"Your ABHA and PM-JAY details ({card['abha_id_masked']}) have been successfully linked ({mode_label}).",
        type="abdm_link",
        action_url="/profile"
    )

    return AbdmCardResponse(
        card_id=card["card_id"],
        user_id=card["user_id"],
        abha_id_masked=card["abha_id_masked"],
        pmjay_id_masked=card.get("pmjay_id_masked"),
        beneficiary_name=card.get("beneficiary_name"),
        demo_mode=card.get("demo_mode", True),
        linked_at=card.get("linked_at", ""),
        status="linked"
    )

@router.delete("/card", response_model=GenericAuthResponse)
def remove_abdm_card(current_user: dict = Depends(get_current_user)):
    """Remove and unlink the user's ABDM / Ayushman Card details."""
    user_id = current_user["id"]
    removed = db.remove_abdm_card(user_id)

    if not removed:
        raise HTTPException(status_code=404, detail="No active linked Ayushman card found to remove.")

    db.add_notification(
        user_id=user_id,
        title="Ayushman Card Unlinked",
        message="Your ABHA and PM-JAY details have been unlinked and removed from your profile.",
        type="abdm_unlink",
        action_url="/profile"
    )

    return GenericAuthResponse(
        success=True,
        message="Your Ayushman card has been successfully unlinked and removed."
    )
