"""VeloX AI Gateway — Gateway Seeder (Clean Slate)"""
from sqlalchemy.ext.asyncio import AsyncSession


async def seed_gateway_data(db: AsyncSession):
    """Gateway starts with a clean slate. No mock or dummy records are auto-seeded."""
    pass
