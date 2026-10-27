"""
Seed script — populate database with demo data matching the frontend mock.
Run: python -m app.seed
"""
import asyncio
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password
from app.models.tenant import Tenant
from app.models.user import User
from app.models.menu import Category, Food
from app.models.table import Table
from app.models.inventory import Ingredient


async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select
        existing = await db.execute(select(Tenant))
        if existing.scalar_one_or_none():
            print("✅ Ma'lumotlar bazasi allaqachon to'ldirilgan.")
            return

        # 1. Tenant
        tenant = Tenant(
            id="tenant_demo",
            name="TaomGo Demo Restoran",
            address="Toshkent, Chilonzor tumani",
            phone="+998 90 123 45 67",
            currency="UZS",
        )
        db.add(tenant)

        # 2. Users
        users = [
            User(
                id="user_admin",
                username="admin",
                full_name="Sirojbek Menejer",
                hashed_password=hash_password("admin123"),
                role="admin",
                tenant_id="tenant_demo",
            ),
            User(
                id="user_cashier",
                username="cashier",
                full_name="Dilshod Kassir",
                hashed_password=hash_password("cashier123"),
                role="cashier",
                tenant_id="tenant_demo",
            ),
            User(
                id="user_chef",
                username="chef",
                full_name="Bahrom Oshpaz",
                hashed_password=hash_password("chef123"),
                role="chef",
                tenant_id="tenant_demo",
            ),
        ]
        db.add_all(users)

        # 3. Categories
        categories = [
            Category(id="cat_salads", name="Salatlar", sort_order=1, icon="🥗", tenant_id="tenant_demo"),
            Category(id="cat_soups", name="Sho'rvalar", sort_order=2, icon="🍜", tenant_id="tenant_demo"),
            Category(id="cat_main", name="Asosiy taomlar", sort_order=3, icon="🍖", tenant_id="tenant_demo"),
            Category(id="cat_kebab", name="Kaboblar", sort_order=4, icon="🥩", tenant_id="tenant_demo"),
            Category(id="cat_bread", name="Non va Yopmalar", sort_order=5, icon="🫓", tenant_id="tenant_demo"),
            Category(id="cat_drinks", name="Ichimliklar", sort_order=6, icon="🥤", tenant_id="tenant_demo"),
            Category(id="cat_desserts", name="Shirinliklar", sort_order=7, icon="🍰", tenant_id="tenant_demo"),
        ]
        db.add_all(categories)

        # 4. Foods
        foods = [
            Food(id="food_1", name="Achichiq salat", category_id="cat_salads", price=18000, cost_price=5000, image_url="", station="kitchen", tenant_id="tenant_demo"),
            Food(id="food_2", name="Sezar salat", category_id="cat_salads", price=28000, cost_price=8000, image_url="", station="kitchen", tenant_id="tenant_demo"),
            Food(id="food_3", name="Mastava", category_id="cat_soups", price=22000, cost_price=6000, image_url="", station="kitchen", tenant_id="tenant_demo"),
            Food(id="food_4", name="Lagʻmon", category_id="cat_soups", price=25000, cost_price=7000, image_url="", station="kitchen", tenant_id="tenant_demo"),
            Food(id="food_5", name="Osh (Palov)", category_id="cat_main", price=30000, cost_price=10000, image_url="", station="kitchen", tenant_id="tenant_demo"),
            Food(id="food_6", name="Norin", category_id="cat_main", price=35000, cost_price=12000, image_url="", station="kitchen", tenant_id="tenant_demo"),
            Food(id="food_7", name="Qoʻy kabob", category_id="cat_kebab", price=38000, cost_price=15000, image_url="", station="mangal", tenant_id="tenant_demo"),
            Food(id="food_8", name="Tovuq kabob", category_id="cat_kebab", price=28000, cost_price=9000, image_url="", station="mangal", tenant_id="tenant_demo"),
            Food(id="food_9", name="Tandir non", category_id="cat_bread", price=5000, cost_price=1500, image_url="", station="kitchen", tenant_id="tenant_demo"),
            Food(id="food_10", name="Soʻmsa", category_id="cat_bread", price=8000, cost_price=2500, image_url="", station="kitchen", tenant_id="tenant_demo"),
            Food(id="food_11", name="Coca-Cola 0.5l", category_id="cat_drinks", price=8000, cost_price=4000, image_url="", station="bar", tenant_id="tenant_demo"),
            Food(id="food_12", name="Koʻk choy", category_id="cat_drinks", price=5000, cost_price=500, image_url="", station="bar", tenant_id="tenant_demo"),
            Food(id="food_13", name="Chak-chak", category_id="cat_desserts", price=15000, cost_price=4000, image_url="", station="kitchen", tenant_id="tenant_demo"),
        ]
        db.add_all(foods)

        # 5. Tables
        tables = []
        for i in range(1, 11):
            hall = "Asosiy zal" if i <= 6 else ("2-qavat" if i <= 8 else "Kabina")
            seats = 4 if i <= 6 else (6 if i <= 8 else 2)
            tables.append(Table(
                id=f"table_{i}",
                number=i,
                hall=hall,
                seats=seats,
                tenant_id="tenant_demo",
            ))
        db.add_all(tables)

        # 6. Ingredients
        ingredients = [
            Ingredient(id="ing_1", name="Goʻsht (qoʻy)", unit="kg", stock_quantity=25, min_limit=5, cost_per_unit=85000, tenant_id="tenant_demo"),
            Ingredient(id="ing_2", name="Guruch", unit="kg", stock_quantity=50, min_limit=10, cost_per_unit=12000, tenant_id="tenant_demo"),
            Ingredient(id="ing_3", name="Sabzavot (aralash)", unit="kg", stock_quantity=30, min_limit=8, cost_per_unit=8000, tenant_id="tenant_demo"),
            Ingredient(id="ing_4", name="Piyoz", unit="kg", stock_quantity=20, min_limit=5, cost_per_unit=5000, tenant_id="tenant_demo"),
            Ingredient(id="ing_5", name="Un", unit="kg", stock_quantity=40, min_limit=10, cost_per_unit=6000, tenant_id="tenant_demo"),
            Ingredient(id="ing_6", name="Yoʻg", unit="litr", stock_quantity=15, min_limit=5, cost_per_unit=18000, tenant_id="tenant_demo"),
            Ingredient(id="ing_7", name="Coca-Cola 0.5l", unit="dona", stock_quantity=100, min_limit=20, cost_per_unit=4000, tenant_id="tenant_demo"),
            Ingredient(id="ing_8", name="Koʻk choy", unit="kg", stock_quantity=5, min_limit=1, cost_per_unit=30000, tenant_id="tenant_demo"),
        ]
        db.add_all(ingredients)

        await db.commit()
        print("🎉 Demo maʻlumotlar muvaffaqiyatli qoʻshildi!")
        print("  👤 admin / admin123")
        print("  👤 cashier / cashier123")
        print("  👤 chef / chef123")


if __name__ == "__main__":
    asyncio.run(seed())
