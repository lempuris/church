from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_leader_or_above
from app.core.database import get_db
from app.models import Member, User
from app.schemas import (
    CellCreate,
    CellDetailResponse,
    CellListResponse,
    CellMemberCreate,
    CellMemberInfo,
    CellResponse,
    CellUpdate,
)
from app.services import get_cell_service

router = APIRouter(prefix="/cells", tags=["cells"])


@router.get("", response_model=CellListResponse)
def list_cells(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    active_only: bool = True,
):
    """List all cell groups with pagination."""
    cell_service = get_cell_service(db)
    cells, total = cell_service.get_cells(
        page=page,
        page_size=page_size,
        search=search,
        active_only=active_only,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return CellListResponse(
        items=[CellResponse(**cell) for cell in cells],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=CellResponse, status_code=status.HTTP_201_CREATED)
def create_cell(
    cell_data: CellCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Create a new cell group."""
    cell_service = get_cell_service(db)

    # Validate leader exists if provided
    if cell_data.leader_id:
        member = db.query(Member).filter(Member.id == cell_data.leader_id).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Leader member not found",
            )

    # Validate assistant leader exists if provided
    if cell_data.assistant_leader_id:
        member = (
            db.query(Member).filter(Member.id == cell_data.assistant_leader_id).first()
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assistant leader member not found",
            )

    cell = cell_service.create_cell(cell_data)
    cell_dict = cell_service.get_cell_detail(cell.id)
    return CellResponse(**cell_dict)


@router.get("/my-cell", response_model=CellDetailResponse | None)
def get_my_cell(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get the cell group for the current user (as leader or member)."""
    cell_service = get_cell_service(db)
    cell = cell_service.get_cell_by_user_id(current_user.id)

    if not cell:
        return None

    cell_dict = cell_service.get_cell_detail(cell.id)
    return CellDetailResponse(**cell_dict)


@router.get("/{cell_id}", response_model=CellDetailResponse)
def get_cell(
    cell_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get a cell group by ID with full member list."""
    cell_service = get_cell_service(db)
    cell_dict = cell_service.get_cell_detail(cell_id)

    if not cell_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cell not found",
        )

    return CellDetailResponse(**cell_dict)


@router.put("/{cell_id}", response_model=CellResponse)
def update_cell(
    cell_id: UUID,
    cell_data: CellUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Update a cell group."""
    cell_service = get_cell_service(db)

    # Validate leader exists if provided
    if cell_data.leader_id:
        member = db.query(Member).filter(Member.id == cell_data.leader_id).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Leader member not found",
            )

    # Validate assistant leader exists if provided
    if cell_data.assistant_leader_id:
        member = (
            db.query(Member).filter(Member.id == cell_data.assistant_leader_id).first()
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assistant leader member not found",
            )

    cell = cell_service.update_cell(cell_id, cell_data)
    if not cell:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cell not found",
        )

    cell_dict = cell_service.get_cell_detail(cell.id)
    return CellResponse(**cell_dict)


@router.delete("/{cell_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cell(
    cell_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Soft delete a cell group (set is_active = false)."""
    cell_service = get_cell_service(db)
    success = cell_service.delete_cell(cell_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cell not found",
        )

    return None


@router.get("/{cell_id}/members", response_model=list[CellMemberInfo])
def get_cell_members(
    cell_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get all members of a cell group."""
    cell_service = get_cell_service(db)

    # Verify cell exists
    cell = cell_service.get_cell_by_id(cell_id)
    if not cell:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cell not found",
        )

    members = cell_service.get_cell_members(cell_id)
    return members


@router.post(
    "/{cell_id}/members",
    response_model=CellMemberInfo,
    status_code=status.HTTP_201_CREATED,
)
def add_cell_member(
    cell_id: UUID,
    member_data: CellMemberCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Add a member to a cell group."""
    cell_service = get_cell_service(db)

    cell_member = cell_service.add_member_to_cell(cell_id, member_data.member_id)
    if not cell_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not add member to cell. Cell or member may not exist.",
        )

    # Get member info
    member = db.query(Member).filter(Member.id == member_data.member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    return CellMemberInfo(
        id=member.id,
        first_name=member.first_name,
        last_name=member.last_name,
        photo_url=member.photo_url,
        email=member.email,
        phone=member.phone,
    )


@router.delete("/{cell_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cell_member(
    cell_id: UUID,
    member_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Remove a member from a cell group."""
    cell_service = get_cell_service(db)
    success = cell_service.remove_member_from_cell(cell_id, member_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in cell",
        )

    return None
