"""
Seed script — populate database with comprehensive demo data.
Creates Super Admin, Restaurant Admin, Cashier, Chef, Waiter, Courier,
Categories, Foods, Tables, Ingredients, Recipes, and an initial Cash Shift.

Run: python -m app.seed
"""
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password
import app.models  # Load all models

from app.models.tenant import Tenant
from app.models.user import User
from app.models.menu import Category, Food
from app.models.table import Table
from app.models.inventory import Ingredient, RecipeLine
from app.models.cash_shift import CashShift


async def seed():
    # 1. Ensure all tables are created
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        existing_tenant = await db.scalar(select(Tenant.id))
        if existing_tenant:
            print("✅ Ma'lumotlar bazasi allaqachon to'ldirilgan.")
            return

        # 2. Super Admin (Platform Manager)
        super_admin = User(
            id="user_super_admin",
            username="superadmin",
            full_name="Platforma Nazoratchisi (Super Admin)",
            phone="+998 90 000 00 01",
            hashed_password=hash_password("superadmin123"),
            role="super_admin",
            tenant_id=None,
            is_active=True,
        )
        db.add(super_admin)

        # 3. Main Demo Restaurant
        tenant = Tenant(
            id="tenant_demo",
            name="Rayhon Milliy Taomlar",
            address="Toshkent sh., Chilonzor tumani, 9-mavze, 24-uy",
            phone="+998 71 200 45 45",
            currency="so'm",
            status="active",
            subscription_plan="enterprise",
        )
        db.add(tenant)
        await db.flush()

        # 4. Restaurant Staff Users
        staff_users = [
            User(
                id="user_admin",
                username="admin",
                full_name="Alisher Qodirov (Restoran Menejeri)",
                phone="+998 90 123 45 67",
                hashed_password=hash_password("admin123"),
                role="admin",
                tenant_id="tenant_demo",
                is_active=True,
            ),
            User(
                id="user_cashier",
                username="cashier",
                full_name="Shahnoza Karimova (Kassir)",
                phone="+998 91 234 56 78",
                hashed_password=hash_password("cashier123"),
                role="cashier",
                tenant_id="tenant_demo",
                is_active=True,
            ),
            User(
                id="user_chef",
                username="chef",
                full_name="Bahodir Usta (Bosh Oshpaz)",
                phone="+998 93 345 67 89",
                hashed_password=hash_password("chef123"),
                role="chef",
                tenant_id="tenant_demo",
                is_active=True,
            ),
            User(
                id="user_waiter",
                username="waiter",
                full_name="Jasur Bek (Bosh Ofitsiant)",
                phone="+998 94 456 78 90",
                hashed_password=hash_password("waiter123"),
                role="waiter",
                tenant_id="tenant_demo",
                is_active=True,
            ),
            User(
                id="user_courier",
                username="courier",
                full_name="Murod Tezkor (Kuryer)",
                phone="+998 97 567 89 01",
                hashed_password=hash_password("courier123"),
                role="courier",
                tenant_id="tenant_demo",
                is_active=True,
            ),
        ]
        db.add_all(staff_users)

        # 5. Menu Categories
        categories = [
            Category(id="cat_osh", name="Milliy taomlar", sort_order=1, icon="UtensilsCrossed", tenant_id="tenant_demo"),
            Category(id="cat_mangal", name="Shashlik & Mangal", sort_order=2, icon="Flame", tenant_id="tenant_demo"),
            Category(id="cat_xamir", name="Xamir ovqatlar", sort_order=3, icon="Wheat", tenant_id="tenant_demo"),
            Category(id="cat_salat", name="Salatlar & Gazaklar", sort_order=4, icon="Salad", tenant_id="tenant_demo"),
            Category(id="cat_ichimlik", name="Ichimliklar & Bar", sort_order=5, icon="Coffee", tenant_id="tenant_demo"),
            Category(id="cat_shirinlik", name="Shirinliklar", sort_order=6, icon="Cake", tenant_id="tenant_demo"),
        ]
        db.add_all(categories)

        # 6. Foods
        foods = [
            Food(
                id="food_1",
                name="Toshkent to'y oshi",
                category_id="cat_osh",
                price=42000,
                cost_price=21500,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80",
                station="kitchen",
                description="Devzira guruch, barra qo'y go'shti, sariq sabzi, no'xat, mayiz va bedana tuxumi",
                tenant_id="tenant_demo",
            ),
            Food(
                id="food_2",
                name="Choyxona palov",
                category_id="cat_osh",
                price=40000,
                cost_price=19800,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80",
                station="kitchen",
                description="To'q qovurilgan lahm go'sht, sarimsoqpiyoz va achchiq qalampir bilan",
                tenant_id="tenant_demo",
            ),
            Food(
                id="food_3",
                name="Qovurma lag'mon",
                category_id="cat_xamir",
                price=38000,
                cost_price=17200,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
                station="kitchen",
                description="Qo'lda cho'zilgan xamir, shirali mol go'shti va qovurilgan sabzavotlar",
                tenant_id="tenant_demo",
            ),
            Food(
                id="food_4",
                name="Qoʻy goʻshti kabob (Lahm)",
                category_id="cat_mangal",
                price=24000,
                cost_price=12000,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
                station="mangal",
                description="Mayin qo'y go'shti, dum yog'i va xushbo'y ziravorlar",
                tenant_id="tenant_demo",
            ),
            Food(
                id="food_5",
                name="Achchiq-chuchuk",
                category_id="cat_salat",
                price=15000,
                cost_price=5000,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
                station="kitchen",
                description="Yuzik to'g'ralgan pomidor, bodring, piyoz va rayhon",
                tenant_id="tenant_demo",
            ),
            Food(
                id="food_6",
                name="Koʻk choy (Limon va asal bilan)",
                category_id="cat_ichimlik",
                price=10000,
                cost_price=2000,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
                station="bar",
                description="Navoiy ko'k choyi, yangi siqilgan limon va tog' asali",
                tenant_id="tenant_demo",
            ),
        ]
        db.add_all(foods)

        # 7. Tables
        tables = []
        for i in range(1, 13):
            hall = "Asosiy zal" if i <= 6 else ("2-qavat" if i <= 9 else "Kabina")
            seats = 4 if i <= 6 else (6 if i <= 9 else 8)
            tables.append(Table(
                id=f"table_{i}",
                number=i,
                hall=hall,
                seats=seats,
                status="available",
                is_occupied=False,
                current_total=0.0,
                x=float((i - 1) % 4 * 120 + 40),
                y=float((i - 1) // 4 * 120 + 40),
                tenant_id="tenant_demo",
            ))
        db.add_all(tables)

        # 8. Ingredients
        ingredients = [
            Ingredient(id="ing_1", name="Devzira guruch", unit="kg", stock_quantity=45, min_limit=15, cost_per_unit=28000, tenant_id="tenant_demo"),
            Ingredient(id="ing_2", name="Qoʻy goʻshti (lahm)", unit="kg", stock_quantity=32, min_limit=10, cost_per_unit=92000, tenant_id="tenant_demo"),
            Ingredient(id="ing_3", name="Sariq sabzi", unit="kg", stock_quantity=60, min_limit=20, cost_per_unit=6000, tenant_id="tenant_demo"),
            Ingredient(id="ing_4", name="Piyoz", unit="kg", stock_quantity=50, min_limit=15, cost_per_unit=4500, tenant_id="tenant_demo"),
            Ingredient(id="ing_5", name="Paxta yogʻi", unit="litr", stock_quantity=25, min_limit=8, cost_per_unit=19000, tenant_id="tenant_demo"),
            Ingredient(id="ing_6", name="Pomidor (Yusupov)", unit="kg", stock_quantity=18, min_limit=10, cost_per_unit=16000, tenant_id="tenant_demo"),
        ]
        db.add_all(ingredients)
        await db.flush()

        # 9. Recipe Lines for Toshkent Oshi
        recipes = [
            RecipeLine(food_id="food_1", ingredient_id="ing_1", ingredient_name="Devzira guruch", unit="kg", quantity_per_portion=0.2, cost=5600),
            RecipeLine(food_id="food_1", ingredient_id="ing_2", ingredient_name="Qoʻy goʻshti (lahm)", unit="kg", quantity_per_portion=0.15, cost=13800),
            RecipeLine(food_id="food_1", ingredient_id="ing_3", ingredient_name="Sariq sabzi", unit="kg", quantity_per_portion=0.25, cost=1500),
        ]
        db.add_all(recipes)

        # 10. Initial Open Cash Shift for cashier
        shift = CashShift(
            id="shift_initial",
            tenant_id="tenant_demo",
            cashier_id="user_cashier",
            cashier_name="Shahnoza Karimova (Kassir)",
            initial_cash=500000.0,
            expected_cash=500000.0,
            is_open=True,
            notes="Bugungi boshlang'ich kassa smenasi",
        )
        db.add(shift)

        await db.commit()
        print("🎉 TaomGo ma'lumotlar bazasi to'liq to'ldirildi!")
        print("--------------------------------------------------")
        print("👑 Super Admin: superadmin / superadmin123")
        print("🏢 Restoran Admin: admin / admin123")
        print("💵 Kassir: cashier / cashier123")
        print("👨‍🍳 Bosh Oshpaz: chef / chef123")
        print("🤵 Ofitsiant: waiter / waiter123")
        print("🛵 Kuryer: courier / courier123")
        print("--------------------------------------------------")


if __name__ == "__main__":
    asyncio.run(seed())
