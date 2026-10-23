
from fastapi import APIRouter

from app.api.v1.endpoints import quotations, outlook

api_router = APIRouter()

api_router.include_router(
    quotations.router,
    prefix="/quotations",
    tags=["Quotations"],
)

api_router.include_router(
    outlook.router,
    prefix="/outlook",
    tags=["Outlook"],
)
