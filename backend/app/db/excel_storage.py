
from pathlib import Path
from typing import Any

from openpyxl import Workbook, load_workbook


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data"
EXCEL_FILE = DATA_DIR / "airtech.xlsx"


# Each worksheet has its own columns.
SHEETS = {
    "Customers": [
        "customer_id",
        "name",
        "phone",
        "email",
        "address",
    ],
    
    "Quotations": [
        "quotation_id",
        "quotation_number",
        "customer_name",
        "customer_company",
        "contact_person",
        "customer_email",
        "customer_phone",
        "customer_address",
        "site_name",
        "site_address",
        "category",
        "quotation_date",
        "validity_days",
        "subtotal",
        "tax_type",
        "tax_percent",
        "tax_amount",
        "discount",
        "total",
        "status",
        "frequency_details",
        "contract_months",
        "maintenance_coverage",
        "notes",
        "terms",
    ],
    "QuotationItems": [
        "quotation_id",
        "description",
        "product_code",
        "quantity",
        "unit",
        "rate",
        "rate_unit",
        "duration",
        "line_total",
    ],
    "Rentals": [
        "rental_id",
        "customer_id",
        "equipment",
        "quantity",
        "monthly_rate",
        "months",
        "status",
    ],
    "Airtime": [
        "airtime_id",
        "customer_id",
        "service",
        "quantity",
        "amount",
        "status",
    ],
}

def ensure_workbook() -> Path:
    """Create the data folder and workbook if they do not exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not EXCEL_FILE.exists():
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = "Customers"

        for sheet_name, headers in SHEETS.items():
            if sheet_name == "Customers":
                current_sheet = worksheet
            else:
                current_sheet = workbook.create_sheet(sheet_name)

            current_sheet.append(headers)

        try:
            workbook.save(EXCEL_FILE)
        finally:
            workbook.close()

        return EXCEL_FILE


    # Add missing sheets and safely migrate worksheet headers.
    workbook = load_workbook(EXCEL_FILE)

    try:
        for sheet_name, headers in SHEETS.items():
            if sheet_name not in workbook.sheetnames:
                worksheet = workbook.create_sheet(sheet_name)
                worksheet.append(headers)
                continue

            worksheet = workbook[sheet_name]

            existing_headers = [
                cell.value
                for cell in worksheet[1]
            ]

            # Initialize an empty worksheet.
            if not any(header is not None for header in existing_headers):
                worksheet.append(headers)
                continue

            # Preserve existing records and append newly required columns.
            missing_headers = [
                header
                for header in headers
                if header not in existing_headers
            ]

            for header in missing_headers:
                existing_headers.append(header)
                worksheet.cell(
                    row=1,
                    column=len(existing_headers),
                    value=header,
                )

    finally:
        workbook.save(EXCEL_FILE)
        workbook.close()

    return EXCEL_FILE

def read_records(sheet_name: str) -> list[dict[str, Any]]:
    """Read worksheet rows as dictionaries."""
    if sheet_name not in SHEETS:
        raise ValueError(f"Unknown worksheet: {sheet_name}")

    ensure_workbook()

    workbook = load_workbook(
        EXCEL_FILE,
        read_only=True,
        data_only=True,
    )

    try:
        worksheet = workbook[sheet_name]
        rows = worksheet.iter_rows(values_only=True)
        headers = next(rows, ())

        return [
            dict(zip(headers, row))
            for row in rows
            if any(value is not None for value in row)
        ]
    finally:
        workbook.close()



def append_record(
    sheet_name: str,
    record: dict[str, Any],
) -> dict[str, Any]:
    """Append a record using the worksheet's actual headers."""
    if sheet_name not in SHEETS:
        raise ValueError(f"Unknown worksheet: {sheet_name}")

    expected_headers = SHEETS[sheet_name]
    unknown_fields = set(record) - set(expected_headers)

    if unknown_fields:
        raise ValueError(
            f"Unknown fields for {sheet_name}: "
            f"{', '.join(sorted(unknown_fields))}"
        )

    ensure_workbook()
    workbook = load_workbook(EXCEL_FILE)

    try:
        worksheet = workbook[sheet_name]

        actual_headers = [
            cell.value for cell in worksheet[1]
        ]

        # Keep existing headers and append missing required headers.
        actual_headers = [
            header for header in actual_headers
            if header is not None
        ]

        for header in expected_headers:
            if header not in actual_headers:
                actual_headers.append(header)
                worksheet.cell(
                    row=1,
                    column=len(actual_headers),
                    value=header,
                )

        saved_record = {
            header: record.get(header)
            for header in expected_headers
        }

        # Write each value under its matching header.
        worksheet.append([
            saved_record.get(header)
            for header in actual_headers
        ])

        workbook.save(EXCEL_FILE)

    finally:
        workbook.close()

    return saved_record
