"""VeloX AI Gateway — Standardized API Response Schemas"""
from pydantic import BaseModel
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T | None = None
    message: str = ""
    code: int = 200


class PaginatedData(BaseModel, Generic[T]):
    items: list[T] = []
    page: int = 1
    size: int = 20
    total: int = 0

    @property
    def pages(self) -> int:
        return max(1, -(-self.total // self.size))


def ok(data: Any = None, message: str = "Success") -> dict:
    return {"success": True, "data": data, "message": message, "code": 200}


def fail(message: str = "Error", code: int = 400) -> dict:
    return {"success": False, "data": None, "message": message, "code": code}
