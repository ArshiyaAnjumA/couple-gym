from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..core.database import get_db
from ..dependencies.auth import get_current_active_user
from ..models.user import User
from ..models.share import SharePermissions

router = APIRouter(prefix="/share", tags=["sharing"])

@router.post("/permissions")
async def create_share_permissions(
    viewer_email: str,
    can_view_progress: bool = False,
    can_view_habits: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Find viewer user by email
    viewer = db.query(User).filter(User.email == viewer_email).first()
    if not viewer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found"
        )
    
    if viewer.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot share with yourself"
        )
    
    # Check if permissions already exist
    existing = db.query(SharePermissions).filter(
        SharePermissions.owner_user_id == current_user.id,
        SharePermissions.viewer_user_id == viewer.id
    ).first()
    
    if existing:
        # Update existing permissions
        existing.can_view_progress = can_view_progress
        existing.can_view_habits = can_view_habits
        db.commit()
        db.refresh(existing)
        
        return {
            "id": existing.id,
            "viewer_email": viewer_email,
            "viewer_name": viewer.display_name,
            "can_view_progress": existing.can_view_progress,
            "can_view_habits": existing.can_view_habits,
            "updated_at": existing.updated_at
        }
    else:
        # Create new permissions
        permissions = SharePermissions(
            owner_user_id=current_user.id,
            viewer_user_id=viewer.id,
            can_view_progress=can_view_progress,
            can_view_habits=can_view_habits
        )
        db.add(permissions)
        db.commit()
        db.refresh(permissions)
        
        return {
            "id": permissions.id,
            "viewer_email": viewer_email,
            "viewer_name": viewer.display_name,
            "can_view_progress": permissions.can_view_progress,
            "can_view_habits": permissions.can_view_habits,
            "created_at": permissions.created_at
        }

@router.get("/permissions")
async def get_share_permissions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get permissions where current user is the owner (sharing their data)
    owned_permissions = db.query(SharePermissions).filter(
        SharePermissions.owner_user_id == current_user.id
    ).all()
    
    # Get permissions where current user is the viewer (can view others' data)  
    received_permissions = db.query(SharePermissions).filter(
        SharePermissions.viewer_user_id == current_user.id
    ).all()
    
    owned_result = []
    for perm in owned_permissions:
        viewer = db.query(User).filter(User.id == perm.viewer_user_id).first()
        owned_result.append({
            "id": perm.id,
            "viewer_email": viewer.email if viewer else None,
            "viewer_name": viewer.display_name if viewer else None,
            "can_view_progress": perm.can_view_progress,
            "can_view_habits": perm.can_view_habits,
            "created_at": perm.created_at
        })
    
    received_result = []
    for perm in received_permissions:
        owner = db.query(User).filter(User.id == perm.owner_user_id).first()
        received_result.append({
            "id": perm.id,
            "owner_email": owner.email if owner else None,
            "owner_name": owner.display_name if owner else None,
            "can_view_progress": perm.can_view_progress,
            "can_view_habits": perm.can_view_habits,
            "created_at": perm.created_at
        })
    
    return {
        "sharing_with_others": owned_result,
        "receiving_from_others": received_result
    }

@router.delete("/permissions/{permission_id}")
async def revoke_share_permission(
    permission_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Find permission - user must be the owner to revoke
    permission = db.query(SharePermissions).filter(
        SharePermissions.id == permission_id,
        SharePermissions.owner_user_id == current_user.id
    ).first()
    
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found or you don't own it"
        )
    
    db.delete(permission)
    db.commit()
    
    return {"message": "Permission revoked successfully"}

@router.get("/available")
async def get_shared_data_available(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get list of users whose data the current user can access"""
    
    # Get permissions where current user is the viewer
    permissions = db.query(SharePermissions).filter(
        SharePermissions.viewer_user_id == current_user.id
    ).all()
    
    result = []
    for perm in permissions:
        owner = db.query(User).filter(User.id == perm.owner_user_id).first()
        if owner:
            result.append({
                "user_id": owner.id,
                "name": owner.display_name,
                "avatar_url": owner.avatar_url,
                "can_view_progress": perm.can_view_progress,
                "can_view_habits": perm.can_view_habits
            })
    
    return result