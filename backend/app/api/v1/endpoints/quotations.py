
from fastapi import APIRouter, HTTPException

from app.services.quotation_service import (
    create_quotation,
    get_quotation,
    list_quotations,
)

router = APIRouter()


@router.post("/")
def create_quotation_endpoint(payload: dict):
    return {
        "quotation": create_quotation(payload),
    }


@router.get("/")
def list_quotations_endpoint():
    return {
        "quotations": list_quotations(),
    }


@router.get("/{quotation_id}")
def get_quotation_endpoint(quotation_id: str):
    return {
        "quotation": get_quotation(quotation_id),
    }
