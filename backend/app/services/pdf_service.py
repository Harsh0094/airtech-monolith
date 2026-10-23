
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException
from jinja2 import Environment, FileSystemLoader, select_autoescape
from playwright.sync_api import sync_playwright

from app.services.quotation_service import get_quotation


APP_DIR = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = APP_DIR / "templates"
CSS_FILE = TEMPLATE_DIR / "quotation.css"

templates = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def format_money(value) -> str:
    """Format a numeric value as a readable monetary amount."""
    try:
        return f"{float(value or 0):,.2f}"
    except (ValueError, TypeError):
        return "0.00"



def generate_quotation_pdf(quotation_id: str) -> BytesIO:
    """Render a saved quotation using the editable HTML/CSS template."""
    quotation = get_quotation(quotation_id)

    items = []
    for item in quotation.get("items", []):
        items.append({
            **item,
            "quantity": item.get("quantity", 0),
            "unit": item.get("unit") or "Nos",
            "rate": format_money(item.get("rate")),
            "rate_unit": item.get("rate_unit") or "",
            "duration": item.get("duration", 1),
            "line_total": format_money(item.get("line_total")),
        })

    context = {
        **quotation,
        "company_address": (
            "C-509, Groma House, Plot No. 14C, Sector-19, "
            "Vashi, Navi Mumbai - 400703"
        ),
        "company_contact": "",
        "subject": f"Offer for {quotation.get('category') or 'products and services'}",
        "introduction": "Greetings from Airtech Solutions.",
        "offer_title": f"Offer for {quotation.get('category') or 'products and services'}",
        "customer_company": quotation.get("customer_company") or "",
        "customer_name": quotation.get("customer_name") or "",
        "customer_address": quotation.get("customer_address") or "",
        "contact_person": quotation.get("contact_person") or "",
        "site_name": quotation.get("site_name") or "",
        "site_address": quotation.get("site_address") or "",
        "quotation_number": quotation.get("quotation_number") or "",
        "quotation_date": quotation.get("quotation_date") or "",
        "validity_days": quotation.get("validity_days") or 30,
        "subtotal": format_money(quotation.get("subtotal")),
        "discount": format_money(quotation.get("discount")),
        "tax_amount": format_money(quotation.get("tax_amount")),
        "total": format_money(quotation.get("total")),
        "tax_percent": quotation.get("tax_percent", 0),
        "tax_type": quotation.get("tax_type") or "GST",
        "terms": quotation.get("terms") or "",
        "items": items,
    }

    try:
        template = templates.get_template("quotation.html")
        html = template.render(**context)

        if CSS_FILE.exists():
            css = CSS_FILE.read_text(encoding="utf-8")
            style_tag = f"<style>\n{css}\n</style>"

            if "</head>" in html:
                html = html.replace("</head>", f"{style_tag}\n</head>", 1)
            else:
                html = f"{style_tag}\n{html}"

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            try:
                page = browser.new_page()
                page.set_content(html, wait_until="load")

                pdf_bytes = page.pdf(
                    format="A4",
                    print_background=True,
                    display_header_footer=False,
                    prefer_css_page_size=True,
                    margin={
                        "top": "16mm",
                        "right": "14mm",
                        "bottom": "18mm",
                        "left": "14mm",
                    },
                )
            finally:
                browser.close()

        return BytesIO(pdf_bytes)

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate quotation PDF: {exc}",
        ) from exc
