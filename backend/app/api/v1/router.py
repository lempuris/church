from fastapi import APIRouter

from app.api.v1.endpoints import auth, dashboard, members

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(members.router)
api_router.include_router(dashboard.router)
