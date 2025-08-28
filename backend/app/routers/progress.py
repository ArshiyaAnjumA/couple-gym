from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
import uuid

from ..core.database import get_db
from ..dependencies.auth import get_current_active_user
from ..models.user import User
from ..models.progress import ProgressSnapshot
from ..models.couple import CoupleMember
from ..models.share import SharePermissions

router = APIRouter(prefix="/progress", tags=["progress"])

@router.post("/snapshots")
async def create_progress_snapshot(
    snapshot_date: date,
    metrics: dict,  # {"weight_kg": float?, "bodyfat_pct": float?, "waist_cm": float?, "workouts_completed_week": int, "habits_completed_week": int}
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if snapshot already exists for this date
    existing = db.query(ProgressSnapshot).filter(
        ProgressSnapshot.user_id == current_user.id,
        ProgressSnapshot.date == snapshot_date
    ).first()
    
    if existing:
        # Update existing snapshot
        existing.metrics = metrics
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "date": existing.date,
            "metrics": existing.metrics,
            "created_at": existing.created_at
        }
    else:
        # Create new snapshot
        snapshot = ProgressSnapshot(
            user_id=current_user.id,
            date=snapshot_date,
            metrics=metrics
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        
        return {
            "id": snapshot.id,
            "date": snapshot.date,
            "metrics": snapshot.metrics,
            "created_at": snapshot.created_at
        }

@router.get("/snapshots")
async def get_progress_snapshots(
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(ProgressSnapshot).filter(
        ProgressSnapshot.user_id == current_user.id
    )
    
    if from_date:
        query = query.filter(ProgressSnapshot.date >= from_date)
    
    if to_date:
        query = query.filter(ProgressSnapshot.date <= to_date)
    
    snapshots = query.order_by(ProgressSnapshot.date.desc()).all()
    
    result = []
    for snapshot in snapshots:
        result.append({
            "id": snapshot.id,
            "date": snapshot.date,
            "metrics": snapshot.metrics,
            "created_at": snapshot.created_at
        })
    
    return result

@router.get("/partner")
async def get_partner_progress(
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Find user's couple
    membership = db.query(CoupleMember).filter(
        CoupleMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not part of a couple"
        )
    
    # Find partner
    partner_membership = db.query(CoupleMember).filter(
        CoupleMember.couple_id == membership.couple_id,
        CoupleMember.user_id != current_user.id
    ).first()
    
    if not partner_membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner not found"
        )
    
    # Check if partner allows progress sharing
    permissions = db.query(SharePermissions).filter(
        SharePermissions.owner_user_id == partner_membership.user_id,
        SharePermissions.viewer_user_id == current_user.id,
        SharePermissions.can_view_progress == True
    ).first()
    
    if not permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Partner has not granted permission to view their progress"
        )
    
    # Get partner's progress snapshots
    query = db.query(ProgressSnapshot).filter(
        ProgressSnapshot.user_id == partner_membership.user_id
    )
    
    if from_date:
        query = query.filter(ProgressSnapshot.date >= from_date)
    
    if to_date:
        query = query.filter(ProgressSnapshot.date <= to_date)
    
    snapshots = query.order_by(ProgressSnapshot.date.desc()).all()
    
    # Get partner info
    partner = db.query(User).filter(User.id == partner_membership.user_id).first()
    
    result = []
    for snapshot in snapshots:
        result.append({
            "id": snapshot.id,
            "date": snapshot.date,
            "metrics": snapshot.metrics,
            "created_at": snapshot.created_at
        })
    
    return {
        "partner_name": partner.display_name if partner else "Partner",
        "progress": result
    }

@router.get("/summary")
async def get_progress_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get latest snapshot
    latest = db.query(ProgressSnapshot).filter(
        ProgressSnapshot.user_id == current_user.id
    ).order_by(ProgressSnapshot.date.desc()).first()
    
    # Get snapshot from 30 days ago for comparison
    from datetime import timedelta
    month_ago = date.today() - timedelta(days=30)
    
    month_ago_snapshot = db.query(ProgressSnapshot).filter(
        ProgressSnapshot.user_id == current_user.id,
        ProgressSnapshot.date <= month_ago
    ).order_by(ProgressSnapshot.date.desc()).first()
    
    result = {
        "current": latest.metrics if latest else {},
        "current_date": latest.date if latest else None,
        "previous": month_ago_snapshot.metrics if month_ago_snapshot else {},
        "previous_date": month_ago_snapshot.date if month_ago_snapshot else None,
        "changes": {}
    }
    
    # Calculate changes
    if latest and month_ago_snapshot:
        current_metrics = latest.metrics
        previous_metrics = month_ago_snapshot.metrics
        
        for key in current_metrics:
            if key in previous_metrics and isinstance(current_metrics[key], (int, float)):
                change = current_metrics[key] - previous_metrics[key]
                result["changes"][key] = change
    
    return result