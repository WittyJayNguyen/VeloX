"""Script to normalize AI models pricing in database to standard affordable credit rates."""
import asyncio
from app.core.database import async_session
from app.modules.models_catalog.models import AIModel
from sqlalchemy import select

async def normalize_pricing():
    async with async_session() as db:
        res = await db.execute(select(AIModel))
        models = res.scalars().all()
        
        updated_count = 0
        for m in models:
            # 1. Normalize Chat / Text models
            if m.category == "CHAT":
                # Ensure selling_credit_price is 1 (or 2 for heavy reasoning o1)
                m.selling_credit_price = 2 if "o1" in m.model_code.lower() else 1
                
                # If input_credit_price is abnormally high (e.g. > 1000), it was saved in VND, divide by 1000
                if m.input_credit_price and m.input_credit_price > 1000:
                    m.input_credit_price = max(1, int(round(m.input_credit_price / 1000.0)))
                if m.output_credit_price and m.output_credit_price > 1000:
                    m.output_credit_price = max(1, int(round(m.output_credit_price / 1000.0)))
                if m.cache_read_credit_price and m.cache_read_credit_price > 1000:
                    m.cache_read_credit_price = max(1, int(round(m.cache_read_credit_price / 1000.0)))

                # Special overrides for flagship models to ensure great pricing
                if m.model_code == "gpt-4o":
                    m.input_credit_price = 75
                    m.output_credit_price = 300
                    m.cache_read_credit_price = 38
                elif m.model_code == "gpt-4o-mini":
                    m.input_credit_price = 5
                    m.output_credit_price = 18
                    m.cache_read_credit_price = 3
                elif m.model_code in ["o1", "o1-preview"]:
                    m.input_credit_price = 450
                    m.output_credit_price = 1800
                    m.cache_read_credit_price = 225
                elif m.model_code == "claude-3-5-sonnet":
                    m.input_credit_price = 90
                    m.output_credit_price = 450
                    m.cache_read_credit_price = 9
                elif m.model_code == "claude-3-5-haiku":
                    m.input_credit_price = 24
                    m.output_credit_price = 120
                    m.cache_read_credit_price = 3
                elif m.model_code == "deepseek-chat":
                    m.input_credit_price = 5
                    m.output_credit_price = 10
                    m.cache_read_credit_price = 1
                elif m.model_code == "deepseek-reasoner":
                    m.input_credit_price = 18
                    m.output_credit_price = 70
                    m.cache_read_credit_price = 5
                elif m.model_code == "gemini-2-0-flash":
                    m.input_credit_price = 3
                    m.output_credit_price = 12
                    m.cache_read_credit_price = 1
                elif m.model_code == "gemini-1-5-pro":
                    m.input_credit_price = 38
                    m.output_credit_price = 150
                    m.cache_read_credit_price = 10

            # 2. Normalize Image models
            elif m.category == "IMAGE":
                m.input_credit_price = 0
                m.output_credit_price = 0
                m.cache_read_credit_price = 0
                if m.selling_credit_price and m.selling_credit_price > 100:
                    m.selling_credit_price = max(5, int(round(m.selling_credit_price / 100.0)))
                # Set reasonable defaults if missing or 0
                if not m.selling_credit_price or m.selling_credit_price <= 0:
                    if "flux" in m.model_code.lower():
                        m.selling_credit_price = 8
                    elif "midjourney" in m.model_code.lower():
                        m.selling_credit_price = 35
                    elif "dall-e" in m.model_code.lower():
                        m.selling_credit_price = 30
                    else:
                        m.selling_credit_price = 15

            # 3. Normalize Video models
            elif m.category == "VIDEO":
                m.input_credit_price = 0
                m.output_credit_price = 0
                m.cache_read_credit_price = 0
                if m.selling_credit_price and m.selling_credit_price > 500:
                    m.selling_credit_price = max(20, int(round(m.selling_credit_price / 100.0)))
                # If too small or missing, set reasonable default
                if not m.selling_credit_price or m.selling_credit_price < 20:
                    if "kling" in m.model_code.lower():
                        m.selling_credit_price = 70
                    elif "runway" in m.model_code.lower():
                        m.selling_credit_price = 120
                    elif "luma" in m.model_code.lower():
                        m.selling_credit_price = 80
                    elif "minimax" in m.model_code.lower():
                        m.selling_credit_price = 65
                    else:
                        m.selling_credit_price = 50

            # 4. Normalize Audio/TTS models
            elif m.category == "AUDIO":
                m.input_credit_price = 0
                m.output_credit_price = 0
                m.cache_read_credit_price = 0
                if not m.selling_credit_price or m.selling_credit_price > 50:
                    m.selling_credit_price = 5

            updated_count += 1

        await db.commit()
        print(f"Successfully normalized pricing for {updated_count} models!")

if __name__ == "__main__":
    asyncio.run(normalize_pricing())
