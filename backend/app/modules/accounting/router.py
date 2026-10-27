"""
VeloX AI Gateway — Accounting & Financial Ledger HTTP Router
============================================================
Endpoints for tracking account purchases, provider deposits, COGS depreciation,
and real-time Profit & Loss (P&L) statements.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.modules.accounting.schemas import (
    ExpenseCreateRequest, ExpenseResponse, ExpenseListResponse, AccountingOverviewResponse,
    CashFlowStatementResponse
)
from app.modules.accounting.services import (
    create_expense_entry, list_expense_entries, delete_expense_entry,
    get_accounting_overview, get_cashflow_statement, seed_accounting_defaults
)

router = APIRouter(prefix="/accounting", tags=["Accounting & Financial Ledger"])


@router.get("/overview", response_model=AccountingOverviewResponse)
async def api_get_accounting_overview(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Get full financial overview: Revenue, Capital Expenses, COGS Depreciation,
    Asset Valuation, Gross & Net Profit, and ROI.
    """
    # Ensure defaults exist
    await seed_accounting_defaults(db)
    return await get_accounting_overview(db)


@router.get("/cashflow", response_model=CashFlowStatementResponse)
async def api_get_cashflow_statement(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Get Cash Flow Statement: Inflow vs Outflow, Net Cash Flow, and chronological cash movements.
    """
    return await get_cashflow_statement(db)


@router.get("/expenses", response_model=ExpenseListResponse)
async def api_list_expenses(
    category: Optional[str] = Query(None, description="Filter category"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    List all expense entries (Account purchases, provider top-ups, proxy costs).
    """
    await seed_accounting_defaults(db)
    return await list_expense_entries(category=category, page=page, page_size=page_size, db=db)


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def api_create_expense(
    payload: ExpenseCreateRequest,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Record a new expense entry (Purchasing Muse/OpenAI accounts, top-ups, etc.).
    """
    admin_id = user_payload.get("sub")
    return await create_expense_entry(payload=payload, admin_id=admin_id, db=db)


@router.delete("/expenses/{entry_id}", status_code=status.HTTP_200_OK)
async def api_delete_expense(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Delete an expense entry.
    """
    success = await delete_expense_entry(entry_id=entry_id, db=db)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense entry not found")
    return {"status": "success", "message": "Expense entry deleted successfully"}
