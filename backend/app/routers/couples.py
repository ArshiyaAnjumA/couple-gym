from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import secrets
import string

from ..core.database import get_db
from ..dependencies.auth import get_current_active_user
from ..models.user import User
from ..models.couple import Couple, CoupleMember, CoupleSettings, CoupleRole

router = APIRouter(prefix="/couples", tags=["couples"])

@router.post("/")
async def create_couple(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is already in a couple
    existing_membership = db.query(CoupleMember).filter(
        CoupleMember.user_id == current_user.id
    ).first()
    
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already part of a couple"
        )
    
    # Create new couple
    couple = Couple()
    db.add(couple)
    db.flush()  # Get the ID without committing
    
    # Add current user as owner
    member = CoupleMember(
        user_id=current_user.id,
        couple_id=couple.id,
        role=CoupleRole.owner
    )
    db.add(member)
    
    # Create default settings
    settings = CoupleSettings(
        couple_id=couple.id,
        share_progress_enabled=True,
        share_habits_enabled=True
    )
    db.add(settings)
    
    db.commit()
    
    return {
        "id": couple.id,
        "message": "Couple created successfully",
        "invite_code": "Use /couples/{couple_id}/invite to generate invite code"
    }

@router.post("/{couple_id}/invite")
async def create_invite_code(
    couple_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify user is owner of the couple
    membership = db.query(CoupleMember).filter(
        CoupleMember.user_id == current_user.id,
        CoupleMember.couple_id == couple_id,
        CoupleMember.role == CoupleRole.owner
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only couple owners can generate invite codes"
        )
    
    # Generate a simple invite code (in production, store this securely)
    invite_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    
    return {
        "couple_id": couple_id,
        "invite_code": invite_code,
        "invite_url": f"/couples/{couple_id}/accept?code={invite_code}",
        "message": "Share this code with your partner"
    }

@router.post("/{couple_id}/accept")
async def accept_couple_invite(
    couple_id: uuid.UUID,
    code: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is already in a couple
    existing_membership = db.query(CoupleMember).filter(
        CoupleMember.user_id == current_user.id
    ).first()
    
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already part of a couple"
        )
    
    # Verify couple exists
    couple = db.query(Couple).filter(Couple.id == couple_id).first()
    if not couple:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Couple not found"
        )
    
    # Check if couple already has 2 members
    member_count = db.query(CoupleMember).filter(
        CoupleMember.couple_id == couple_id
    ).count()
    
    if member_count >= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This couple is already full"
        )
    
    # In production, validate the invite code properly
    # For now, just accept any 8-character code
    if len(code) != 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invite code"
        )
    
    # Add user to couple
    member = CoupleMember(
        user_id=current_user.id,
        couple_id=couple_id,
        role=CoupleRole.member
    )
    db.add(member)
    db.commit()
    
    return {
        "message": "Successfully joined couple",
        "couple_id": couple_id
    }

@router.get("/{couple_id}/members")
async def get_couple_members(
    couple_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify user is member of this couple
    membership = db.query(CoupleMember).filter(
        CoupleMember.user_id == current_user.id,
        CoupleMember.couple_id == couple_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this couple"
        )
    
    # Get all members with user info
    members = db.query(CoupleMember).filter(
        CoupleMember.couple_id == couple_id
    ).all()
    
    result = []
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        result.append({
            "user_id": user.id,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "role": member.role,
            "joined_at": member.joined_at
        })
    
    return result

@router.patch("/{couple_id}/settings")
async def update_couple_settings(
    couple_id: uuid.UUID,
    share_progress_enabled: bool = None,
    share_habits_enabled: bool = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify user is member of this couple  
    membership = db.query(CoupleMember).filter(
        CoupleMember.user_id == current_user.id,
        CoupleMember.couple_id == couple_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this couple"
        )
    
    # Get couple settings
    settings = db.query(CoupleSettings).filter(
        CoupleSettings.couple_id == couple_id
    ).first()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Couple settings not found"
        )
    
    # Update settings
    if share_progress_enabled is not None:
        settings.share_progress_enabled = share_progress_enabled
    if share_habits_enabled is not None:
        settings.share_habits_enabled = share_habits_enabled
    
    db.commit()
    db.refresh(settings)
    
    return {
        "share_progress_enabled": settings.share_progress_enabled,
        "share_habits_enabled": settings.share_habits_enabled
    }