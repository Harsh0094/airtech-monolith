
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

from fastapi import HTTPException

from app.db.excel_storage import (
    append_record,
    read_records,
    delete_quotation_records,
)
CENT = Decimal("0.01")


def money(value) -> Decimal:
    return Decimal(str(value)).quantize(
        CENT,
        rounding=ROUND_HALF_UP,
    )


def create_quotation(payload: dict) -> dict:
    """Create a quotation and save it with its line items in Excel."""
    quotation_id = uuid4().hex
    quotation_number = f"QT-{date.today():%Y%m}-{quotation_id[:6].upper()}"

    items = payload.get("items", [])
    if not items:
        raise HTTPException(
            status_code=422,
            detail="Add at least one quotation item.",
        )

    category = payload.get("category", "")
    if category not in {
        "Outright Sale",
        "Airtime/Frequency",
        "Rental",
        "CAMC",
        "NAMC",
    }:
        raise HTTPException(
            status_code=422,
            detail="Invalid quotation category.",
        )

    # Resolve the selected terms template and take a snapshot.
    terms_template_id = str(
        payload.get("terms_template_id") or ""
    ).strip()

    terms_template = None

    if terms_template_id:
        terms_template = next(
            (
                template
                for template in read_records("TermsTemplates")
                if str(template.get("template_id")) == terms_template_id
            ),
            None,
        )

        if terms_template is None:
            raise HTTPException(
                status_code=422,
                detail="The selected terms template was not found.",
            )

        if str(terms_template.get("status", "")).strip() != "Active":
            raise HTTPException(
                status_code=422,
                detail="Only Active terms templates can be selected.",
            )

    template_include_value = (
        terms_template.get("include_in_pdf", True)
        if terms_template
        else False
    )

    if isinstance(template_include_value, bool):
        template_include_in_pdf = template_include_value
    else:
        template_include_in_pdf = (
            str(template_include_value).strip().lower()
            in {"true", "1", "yes"}
        )

    terms_template_name = (
        str(terms_template.get("name") or "")
        if terms_template
        else ""
    )

    terms_template_content_html = (
        str(terms_template.get("content_html") or "")
        if terms_template
        else ""
    )

    # Preserve legacy terms when no template is selected.
    # When a template is selected, use its snapshot only if PDF inclusion
    # is enabled. The manual notes field remains separate.
    if terms_template:
        saved_terms = (
            terms_template_content_html
            if template_include_in_pdf
            else ""
        )
    else:
        saved_terms = str(payload.get("terms") or "")

    prepared_items = []
    subtotal = Decimal("0.00")

    for item in items:
        description = str(item.get("description", "")).strip()
        if not description:
            raise HTTPException(
                status_code=422,
                detail="Every item needs a description.",
            )

        try:
            quantity = Decimal(str(item.get("quantity", 0)))
            rate = Decimal(str(item.get("rate", 0)))
            duration = Decimal(str(item.get("duration", 1)))
        except Exception:
            raise HTTPException(
                status_code=422,
                detail="Item quantity, rate, and duration must be numeric.",
            )

        if (
            not quantity.is_finite()
            or not rate.is_finite()
            or not duration.is_finite()
            or quantity <= 0
            or rate < 0
            or duration <= 0
        ):
            raise HTTPException(
                status_code=422,
                detail=(
                    "Quantity and duration must be positive; "
                    "rate cannot be negative."
                ),
            )

        line_total = money(quantity * rate * duration)
        subtotal += line_total

        prepared_items.append({
            "description": description,
            "product_code": item.get("product_code", ""),
            "quantity": float(quantity),
            "unit": item.get("unit", "Nos"),
            "rate": float(rate),
            "rate_unit": item.get("rate_unit", ""),
            "duration": float(duration),
            "line_total": float(line_total),
        })

    subtotal = money(subtotal)

    try:
        tax_percent = Decimal(str(payload.get("tax_percent", 18)))
        discount = money(payload.get("discount", 0))
    except Exception:
        raise HTTPException(
            status_code=422,
            detail="Tax percentage and discount must be numeric.",
        )

    if (
        not tax_percent.is_finite()
        or tax_percent < 0
        or tax_percent > 100
        or discount < 0
        or discount > subtotal
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "Tax must be between 0 and 100; "
                "discount must not exceed subtotal."
            ),
        )

    tax_amount = money((subtotal - discount) * tax_percent / 100)
    total = money(subtotal - discount + tax_amount)

    quotation_date = payload.get("quotation_date") or date.today().isoformat()
    if isinstance(quotation_date, date):
        quotation_date = quotation_date.isoformat()

    quotation = {
        "quotation_id": quotation_id,
        "quotation_number": quotation_number,
        "customer_name": payload.get("customer_name", ""),
        "customer_company": payload.get("customer_company", ""),
        "contact_person": payload.get("contact_person", ""),
        "customer_email": payload.get("customer_email", ""),
        "customer_phone": payload.get("customer_phone", ""),
        "customer_address": payload.get("customer_address", ""),
        "site_name": payload.get("site_name", ""),
        "site_address": payload.get("site_address", ""),
        "category": category,
        "quotation_date": quotation_date,
        "validity_days": int(payload.get("validity_days", 30)),
        "subtotal": float(subtotal),
        "tax_type": payload.get("tax_type", "CGST/SGST"),
        "tax_percent": float(tax_percent),
        "tax_amount": float(tax_amount),
        "discount": float(discount),
        "total": float(total),
        "status": payload.get("status", "Draft"),
        "frequency_details": payload.get("frequency_details", ""),
        "contract_months": int(payload.get("contract_months", 12)),
        "maintenance_coverage": payload.get("maintenance_coverage", ""),
        "notes": payload.get("notes", ""),
        "terms": saved_terms,
        "terms_template_id": terms_template_id,
        "terms_template_name": terms_template_name,
        "terms_template_content_html": terms_template_content_html,
        "terms_template_include_in_pdf": template_include_in_pdf,
    }

    # Save the quotation, then its items.
    append_record("Quotations", quotation)

    for item in prepared_items:
        append_record(
            "QuotationItems",
            {
                "quotation_id": quotation_id,
                **item,
            },
        )

    return {
        "id": quotation_id,
        "quotation_number": quotation_number,
        **quotation,
        "items": prepared_items,
    }


def get_quotation(quotation_id: str) -> dict:
    """Retrieve one quotation and its items from Excel."""
    quotations = read_records("Quotations")

    quotation = next(
        (
            row
            for row in quotations
            if str(row.get("quotation_id")) == quotation_id
        ),
        None,
    )

    if quotation is None:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found.",
        )

    stored_items = [
        row
        for row in read_records("QuotationItems")
        if str(row.get("quotation_id")) == quotation_id
    ]

    items = [
        {
            "description": (
                item.get("description")
                or item.get("item_description")
                or ""
            ),
            "product_code": item.get("product_code") or "",
            "quantity": item.get("quantity") or 0,
            "unit": item.get("unit") or "Nos",
            "rate": item.get("rate") or 0,
            "rate_unit": item.get("rate_unit") or "",
            "duration": (
                item.get("duration")
                or item.get("duration_months")
                or 1
            ),
            "line_total": item.get("line_total") or 0,
        }
        for item in stored_items
    ]

    return {
        **quotation,
        "id": quotation["quotation_id"],
        "items": items,
    }


def list_quotations() -> list[dict]:
    """List quotations stored in Excel."""
    return [
        {
            **quotation,
            "id": quotation["quotation_id"],
        }
        for quotation in read_records("Quotations")
    ]


def delete_quotation(quotation_id: str) -> dict:
    deleted = delete_quotation_records(quotation_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found.",
        )

    return {
        "message": "Quotation deleted successfully.",
        "quotation_id": quotation_id,
    }