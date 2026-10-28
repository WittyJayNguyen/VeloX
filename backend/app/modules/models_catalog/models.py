"""VeloX AI Gateway — AI Model Catalog Models"""
import uuid
from sqlalchemy import Column, String, Boolean, Float, Integer, Text
from app.common.base_model import Base, TimestampMixin


def generate_uuid() -> str:
    return str(uuid.uuid4())


class AIModel(Base, TimestampMixin):
    __tablename__ = "ai_models"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)                          # 'OpenAI GPT-4o Omni'
    model_code = Column(String(64), unique=True, index=True, nullable=False) # 'gpt-4o'
    category = Column(String(32), default="CHAT")                       # CHAT, IMAGE, VIDEO, DEV_REQ
    provider = Column(String(64), nullable=False)                       # OpenAI, Anthropic, DeepSeek, Midjourney, Runway
    # Base cost and legacy pricing
    cost_per_req_or_1k_tok = Column(Float, default=0.5)                 # Base cost (cents / request or 1k tokens)
    selling_credit_price = Column(Integer, default=250)                 # Selling price in credits

    # Token Pricing per 1 Million Tokens ($ USD from Upstream Provider)
    input_cost_per_1m = Column(Float, default=0.0)                      # Giá gốc Đầu vào ($/1M tokens)
    output_cost_per_1m = Column(Float, default=0.0)                     # Giá gốc Đầu ra ($/1M tokens)
    cache_read_cost_per_1m = Column(Float, default=0.0)                 # Giá gốc Đã cache ($/1M tokens)

    # Selling Pricing in Credits (per 1 Million Tokens)
    input_credit_price = Column(Integer, default=0)                     # Giá bán credits / 1M tokens đầu vào
    output_credit_price = Column(Integer, default=0)                    # Giá bán credits / 1M tokens đầu ra
    cache_read_credit_price = Column(Integer, default=0)                # Giá bán credits / 1M tokens đã cache

    is_available = Column(Boolean, default=True)
    pool_id = Column(String(64), nullable=True)                         # Foreign pool ID reference
    description = Column(Text, nullable=True)
    config = Column(Text, nullable=True, default="{}")                  # Model parameters config (durations, resolutions, aspectRatios, etc.)

    @property
    def cost_price_vnd(self) -> float:
        """Computed cost price in VNĐ (either per request for media or average 1M token cost)"""
        if self.category in ["IMAGE", "VIDEO"] or (not self.input_cost_per_1m and not self.output_cost_per_1m):
            return float(self.cost_per_req_or_1k_tok or 0.0)
        return round((float(self.input_cost_per_1m or 0.0) + float(self.output_cost_per_1m or 0.0)) / 2.0, 2)

    @property
    def selling_price_vnd(self) -> float:
        """Computed selling price in VNĐ (1 Credit = 100 VNĐ benchmark)."""
        CREDIT_TO_VND = 100.0
        if self.category in ["IMAGE", "VIDEO"] or (not self.input_credit_price and not self.output_credit_price):
            return round(float(self.selling_credit_price or 0.0) * CREDIT_TO_VND, 2)
        # Average 1M token selling price in VNĐ
        avg_credits_1m = (float(self.input_credit_price or 0.0) + float(self.output_credit_price or 0.0)) / 2.0
        return round(avg_credits_1m * CREDIT_TO_VND, 2)

    @property
    def profit_vnd(self) -> float:
        """Net profit in VNĐ per unit/request or average 1M tokens."""
        return round(self.selling_price_vnd - self.cost_price_vnd, 2)

    @property
    def profit_margin_pct(self) -> float:
        """Profit margin percentage (Markup % = (Selling - Cost) / Cost * 100)."""
        cost = self.cost_price_vnd
        if cost > 0:
            return round(((self.selling_price_vnd - cost) / cost) * 100.0, 1)
        return 100.0 if self.selling_price_vnd > 0 else 0.0

