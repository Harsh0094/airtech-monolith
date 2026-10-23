import os
import re
import subprocess
from pathlib import Path
from tempfile import gettempdir

from fastapi import APIRouter, HTTPException
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pydantic import BaseModel, EmailStr, Field

from app.services.pdf_service import generate_quotation_pdf
from app.services.quotation_service import get_quotation

router = APIRouter()

# outlook.py is in backend/app/api/v1/endpoints/
# parents[4] resolves to the airtech-monolith project root.
PROJECT_ROOT = Path(__file__).resolve().parents[5]
OUTLOOK_SCRIPT = PROJECT_ROOT / "scripts" / "windows" / "send-quotation.ps1"
TEMPLATE_DIR = PROJECT_ROOT / "backend" / "app" / "templates"
PDF_TEMP_DIR = Path(gettempdir()) / "airtech-quotation-pdfs"

template_env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


class OutlookDraftRequest(BaseModel):
    quotation_id: str = Field(min_length=1, max_length=100)
    recipient: EmailStr
    subject: str = Field(min_length=1, max_length=250)
    # Kept for compatibility with the current frontend request.
    # The actual message body is rendered from quotation_email_body.html.
    body: str = Field(default="", max_length=10000)


def clean_filename_part(value: str) -> str:
    """Convert a value into a safe, readable filename component."""
    value = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", str(value))
    value = re.sub(r"\s+", "_", value.strip())
    value = value.strip("._ ")

    return value or "Unknown"


@router.post("/draft")
def create_outlook_draft(request: OutlookDraftRequest):
    if os.name != "nt":
        raise HTTPException(
            status_code=501,
            detail="Outlook desktop integration is available on Windows only.",
        )

    if not OUTLOOK_SCRIPT.is_file():
        raise HTTPException(
            status_code=500,
            detail=f"The Outlook helper script was not found: {OUTLOOK_SCRIPT}",
        )

    if not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", request.quotation_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid quotation ID format.",
        )

    try:
        quotation = get_quotation(request.quotation_id)

        category = str(quotation.get("category") or "Quotation").strip()
        if category == "Airtime/Frequency":
            category = "Airtime"

        company = (
            quotation.get("customer_company")
            or quotation.get("customer_name")
            or "Customer"
        )
        quotation_number = (
            quotation.get("quotation_number") or request.quotation_id
        )

        filename = (
            f"{clean_filename_part(category)}_"
            f"{clean_filename_part(company)}_"
            f"{clean_filename_part(quotation_number)}.pdf"
        )

        # Render the editable HTML email body template.
        try:
            email_template = template_env.get_template("quotation_email_body.html")
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Could not load backend/app/templates/"
                    f"quotation_email_body.html: {exc}"
                ),
            ) from exc

        contact_name = (
            quotation.get("contact_person")
            or quotation.get("customer_name")
            or "Customer"
        )

        html_body = email_template.render(
            contact_name=contact_name,
            quotation_number=quotation_number,
            category=category,
            category_lower=category.lower(),
            company_name=company,
        )

        # Write the generated PDF to a safe local temp directory.
        pdf_result = generate_quotation_pdf(request.quotation_id)
        PDF_TEMP_DIR.mkdir(parents=True, exist_ok=True)
        pdf_path = PDF_TEMP_DIR / filename

        if hasattr(pdf_result, "getvalue"):
            pdf_bytes = pdf_result.getvalue()
        elif hasattr(pdf_result, "read"):
            pdf_bytes = pdf_result.read()
        else:
            raise TypeError("Unexpected PDF generator return type.")

        if not pdf_bytes.startswith(b"%PDF"):
            raise ValueError(
                "The quotation generator did not return a valid PDF."
            )

        pdf_path.write_bytes(pdf_bytes)

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not prepare the quotation email: {exc}",
        ) from exc

    try:
        # Pass HTML through stdin to avoid command-line quoting/length issues.
        subprocess.Popen(
            [
                "powershell.exe",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(OUTLOOK_SCRIPT),
                "-PdfPath",
                str(pdf_path),
                "-Recipient",
                str(request.recipient),
                "-Subject",
                request.subject,
                "-HtmlBodyBase64",
                __import__("base64").b64encode(
                    html_body.encode("utf-8")
                ).decode("ascii"),
            ],
            cwd=str(PROJECT_ROOT),
        )
    except OSError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not start Outlook: {exc}",
        ) from exc

    return {
        "status": "draft_requested",
        "message": (
            "Outlook should open a draft with the formatted HTML email "
            "and quotation PDF attached. Review it before sending."
        ),
        "attachment_filename": filename,
    }
