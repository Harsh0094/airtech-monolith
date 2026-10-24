
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.quotation_service import (
    create_quotation,
    get_quotation,
    list_quotations,
    delete_quotation,
)
from app.services.pdf_service import generate_quotation_pdf

router = APIRouter()


@router.post("/")
def create_quotation_endpoint(payload: dict):
    return {"quotation": create_quotation(payload)}


@router.get("/")
def list_quotations_endpoint():
    return {"quotations": list_quotations()}


@router.get("/{quotation_id}/pdf")
def download_quotation_pdf(quotation_id: str):
    pdf_file = generate_quotation_pdf(quotation_id)

    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'inline; filename="quotation-{quotation_id}.pdf"'
            )
        },
    )


@router.get("/{quotation_id}")
def get_quotation_endpoint(quotation_id: str):
    return {"quotation": get_quotation(quotation_id)}


@router.delete("/{quotation_id}")
def delete_quotation_endpoint(quotation_id: str):
    return delete_quotation(quotation_id)