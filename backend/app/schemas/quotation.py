
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


class QuotationItemCreate(BaseModel):
    item_description: str = Field(min_length=1, max_length=500)
    quantity: Decimal = Field(gt=0)
    rate: Decimal = Field(ge=0)
    duration_months: int = Field(default=1, ge=1)


class QuotationCreate(BaseModel):
    customer_id: str = Field(min_length=1)
    quotation_date: date = Field(default_factory=date.today)
    gst_rate: Decimal = Field(default=Decimal("18"), ge=0, le=100)
    items: list[QuotationItemCreate] = Field(min_length=1)


class QuotationItemResponse(BaseModel):
    item_description: str
    quantity: Decimal
    rate: Decimal
    duration_months: int
    line_total: Decimal


class QuotationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    quotation_id: str
    customer_id: str
    quotation_date: date
    subtotal: Decimal
    gst_rate: Decimal
    gst: Decimal
    total: Decimal
    status: str
    items: list[QuotationItemResponse]
