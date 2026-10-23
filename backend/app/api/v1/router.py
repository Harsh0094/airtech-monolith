
from fastapi import APIRouter

from app.api.v1.endpoints import quotations

api_router = APIRouter()

api_router.include_router(
    quotations.router,
    prefix="/quotations",
    tags=["Quotations"],
)
