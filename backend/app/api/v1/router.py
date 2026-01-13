from fastapi import APIRouter

from app.api.v1.endpoints import (
    attendance,
    auth,
    cells,
    dashboard,
    events,
    members,
    prayers,
    sermons,
    testimonies,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(members.router)
api_router.include_router(dashboard.router)
api_router.include_router(cells.router)
api_router.include_router(events.router)
api_router.include_router(attendance.router)
api_router.include_router(users.router)
api_router.include_router(sermons.router)
api_router.include_router(prayers.router)
api_router.include_router(testimonies.router)
