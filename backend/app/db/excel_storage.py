
from pathlib import Path
from typing import Any

from openpyxl import Workbook, load_workbook


# Project structure:
# airtech-monolith/
# ├── data/
# │   └── airtech.xlsx
# └── backend/
#     └── app/
#         └── db/
#             └── excel_storage.py

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
        "customer_id",
        "quotation_date",
        "subtotal",
        "gst",
        "total",
        "status",
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

    # Add missing sheets without deleting existing sheets or records.
    workbook = load_workbook(EXCEL_FILE)

    try:
        for sheet_name, headers in SHEETS.items():
            if sheet_name not in workbook.sheetnames:
                worksheet = workbook.create_sheet(sheet_name)
                worksheet.append(headers)
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
    """Append one record to a worksheet and return its saved values."""
    if sheet_name not in SHEETS:
        raise ValueError(f"Unknown worksheet: {sheet_name}")

    headers = SHEETS[sheet_name]
    unknown_fields = set(record) - set(headers)

    if unknown_fields:
        raise ValueError(
            f"Unknown fields for {sheet_name}: "
            f"{', '.join(sorted(unknown_fields))}"
        )

    ensure_workbook()

    saved_record = {
        header: record.get(header)
        for header in headers
    }

    workbook = load_workbook(EXCEL_FILE)

    try:
        worksheet = workbook[sheet_name]
        worksheet.append([
            saved_record[header]
            for header in headers
        ])
        workbook.save(EXCEL_FILE)
    finally:
        workbook.close()

    return saved_record
