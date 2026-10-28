# TaomGo — Professional RMS Audit Report

**Sana:** 2026-10-28  
**Loyiha:** TaomGo — Production-Ready Restaurant Management System  
**Auditorlar:** Senior Full-Stack, Security, QA & DevOps Team  
**Holat:** Audit yakunlandi, bosqichma-bosqich tuzatish rejalashtirildi  

---

## 1. IJROIY XULOSA (EXECUTIVE SUMMARY)

TaomGo loyihasi restoranlar (oshxona KDS, kassa POS, ombor, stollar va moliya) uchun zamonaviy dizayn poydevoriga ega bo'lsa-da, uni real restoranlarda production rejimida ishlatish uchun quyidagi jiddiy tizimli muammolar mavjud edi:

1. **Frontend autentifikatsiyasining soxtaligi (Mock bypass):** Agar brauzerda auth saqlanmagan bo'lsa, `authStore` avtomatik tarzda `admin` rolidagi foydalanuvchini faollashtirgan. Parollar frontendda ochiq solishtirilgan.
2. **Multi-tenant va Super Admin arxitekturasining yo'qligi:** `User` modelida `tenant_id` majburiy (NOT NULL) bo'lib, Super Admin yaratish va butun platformani boshqarish imkoniyati bo'lmagan.
3. **Frontend va Backend API kontraktlarining to'liq mos kelmasligi:** Frontend `USE_MOCK=false` qilinganda deyarli barcha sahifalarda 404/405 xatoliklari bergan (masalan, `/api/v1/categories/` o'rniga backendda `/api/v1/menu/categories/`, `PATCH` o'rniga `PUT`, `POST /api/v1/staff/` endpointi esa backendda umuman mavjud emas edi).
4. **WebSocket xavfsizligi va tenant isolation buzilishi:** Oshxona WebSocket barcha restoranlar uchun bitta umumiy xonaga ulangan, bu esa A restoran buyurtmalarini B restoran ekraniga chiqarib yuborgan.
5. **Muhim rollarning yetishmasligi:** Ofitsiant (`waiter`), Kuryer (`courier`) va Super Admin (`super_admin`) rollari va alohida boshqaruv panellari mavjud emas edi.
6. **SQLAlchemy kutubxonalarining to'liq emasligi:** `greenlet` kutubxonasi `requirements.txt`da bo'lmagani sababli backend bazaga ulanishda xatolik bilan to'xtagan.

---

## 2. TOPILGAN MUAMMOLAR VA TASNIF

### 🔴 1. CRITICAL (Xavfsizlik, Tenant Isolation va Ma'lumotlar Butunligi)

#### [CRIT-01] Frontendda avtomatik Admin huquqi berilishi va soxta autentifikatsiya
- **Fayl yo'li:** `client/src/stores/authStore.ts`, `client/src/features/auth/api.ts`
- **Sabab:** `loadStoredAuth()` funksiyasida `localStorage` bo'sh bo'lsa, avtomatik ravishda `MOCK_USERS.admin.user` qaytarilgan. Login faqat frontenddagi static lug'at bilan tekshirilgan.
- **Ta'sir:** Har qanday foydalanuvchi tizimga kirmasdan turib Admin paneliga to'liq kira olgan.
- **Tuzatish:** Boshlang'ich holatni `user: null, tokens: null` qilish; login jarayonini haqiqiy `/api/v1/auth/login/` orqali JWT olishga ulash, tokenni `localStorage`da xavfsiz saqlash va `/api/v1/auth/me/` orqali profilni tekshirish.

#### [CRIT-02] Multi-Tenant izolyatsiyasi yetishmasligi va Super Admin imkoniyati yo'qligi
- **Fayl yo'li:** `server/app/models/user.py`, `server/app/models/tenant.py`, `server/app/core/deps.py`
- **Sabab:** `users.tenant_id` ustuni `nullable=False` bo'lgani tufayli barcha restoranlardan ustun turuvchi Super Admin foydalanuvchisini yaratib bo'lmagan. Restoranlarni yaratish, bloklash, obunalarini boshqarish imkoniyati bo'lmagan.
- **Ta'sir:** Platforma egasi yangi restoranlarni tizimga ulay olmaydi, restoran egalari bir-biridan mustaqil emas.
- **Tuzatish:** `User.tenant_id` ustunini `nullable=True` qilish; `role="super_admin"` qo'shish; Super Admin uchun alohida `/api/v1/super-admin/` API va `/super-admin` frontend panelini yaratish.

#### [CRIT-03] WebSocket orqali boshqa restoranlar ma'lumotlari sizib chiqishi (Data Leak)
- **Fayl yo'li:** `server/app/api/orders.py`
- **Sabab:** `KitchenConnectionManager` barcha ulangan WebSocket'larni bitta ro'yxatda saqlagan va har qanday yangi buyurtmani barcha ulangan klientlarga filtrsiz `broadcast()` qilgan.
- **Ta'sir:** Restoran A buyurtma berganda, Restoran B oshpazi o'z ekranida o'sha buyurtmani ko'rgan.
- **Tuzatish:** WebSocket ulanishlarini `tenant_id` bo'yicha guruhlash (`connections_by_tenant: Dict[str, List[WebSocket]]`) va faqat tegishli restoran filialiga xabar yuborish.

#### [CRIT-04] SQLAlchemy async ulanishida `greenlet` xatoligi va modellarning o'zaro nomutanosibligi
- **Fayl yo'li:** `server/requirements.txt`, `server/app/seed.py`, `server/app/models/__init__.py`
- **Sabab:** `asyncpg` + `sqlalchemy` async drayveri `greenlet` kutubxonasini talab qiladi, ammo u `requirements.txt`da yo'q edi. `seed.py` ichida `Order` modeli import qilinmagani sababli `Tenant.orders` relationship initializatsiyada qulagan.
- **Ta'sir:** Backend va seed scripti ishga tusha olmagan.
- **Tuzatish:** `greenlet`ni `requirements.txt`ga kiritish, `server/app/models/__init__.py` orqali barcha modellarni bir xil registrda eksport qilish.

---

### 🟠 2. HIGH (Asosiy Funksiyalar va API Kontraktlari Ishlamasligi)

#### [HIGH-01] Frontend va Backend API yo'llari va HTTP metodlari mos kelmasligi
- **Fayl yo'li:** `client/src/features/*`, `server/app/api/*`
- **Sabab:**
  - Menyu: Frontend `/api/v1/categories/` chaqirgan, backendda esa faqat `/api/v1/menu/categories/`.
  - Ombor: Frontend `/api/v1/ingredients/` chaqirgan, backendda esa `/api/v1/inventory/ingredients/`.
  - Buyurtmalar: Frontend `/api/v1/orders/active/` chaqirgan, backendda bunday yo'l mavjud emas edi.
  - Xodimlar: Frontend `POST /api/v1/staff/` chaqirgan, backendda bu endpoint umuman yozilmagan.
  - HTTP metodlari: Frontend `PATCH` so'ragan joyda backend faqat `PUT` qabul qilgan.
- **Ta'sir:** Haqiqiy backend yoqilganda tizim butunlay ishdan chiqqan.
- **Tuzatish:** Backend marshrutlariga mos alias routerlarni qo'shish, `PATCH` va `PUT` metodlarini ikkalasini ham qo'llab-quvvatlash, barcha CRUD amallarini backendda to'liq ta'minlash.

#### [HIGH-02] Ofitsiant (`waiter`) va Kuryer (`delivery`) panellarining yo'qligi
- **Fayl yo'li:** `client/src/App.tsx`, `client/src/types/index.ts`, `server/app/models/order.py`
- **Sabab:** Loyihada faqat Kassa, Oshxona va Admin panellari mavjud edi. Ofitsiant stollarni boshqarishi, buyurtma olishi va yetkazilganini belgilashi, kuryer esa yetkazib berish buyurtmalarini qabul qilishi uchun panel va rollar yo'q edi.
- **Ta'sir:** Restoran xodimlari orasidagi zanjir to'liq ishlamagan.
- **Tuzatish:** `waiter` va `courier` rollarini qo'shish, `/waiter` va `/delivery` maxsus ekranlarini yaratish.

#### [HIGH-03] Kassa smenasi (Cash Shift) va Tranzaksiya nazoratining yo'qligi
- **Fayl yo'li:** `server/app/models/`, `server/app/api/finance.py`, `client/src/pages/PosPage.tsx`
- **Sabab:** Kassir uchun smenani ochish (boshlang'ich naqd pul), yopish, naqd va karta tushumlarini solishtirish, kassa farqlarini aniqlash imkoniyati backendda saqlanmagan.
- **Ta'sir:** Kassirlar hisobdorligi ta'minlanmagan, moliyaviy nazorat bo'lmagan.
- **Tuzatish:** `CashShift` modeli va `/api/v1/finance/shifts/` API endpointsini yaratish, POS interfeysiga smena ochish/yopish oynasini kiritish.

#### [HIGH-04] Audit Loglar va Bekor qilish / Refund nazoratining yo'qligi
- **Fayl yo'li:** `server/app/models/audit.py`, `server/app/api/orders.py`
- **Sabab:** Buyurtmani bekor qilish yoki to'lovni qaytarish (refund) amallarida kim, qachon va nima sababdan qilgani audit logga yozilmagan.
- **Ta'sir:** Suiiste'molliklar va xatolarni aniqlash imkonsiz bo'lgan.
- **Tuzatish:** `AuditLog` modelini yaratish va xavfsizlik / moliyaviy amallarni avtomatik qayd etish.

---

### 🟡 3. MEDIUM (Biznes Mantiqi va UX Kamchiliklari)

#### [MED-01] Stol holatlari (Table Occupancy) boshqaruvi cheklanganligi
- **Fayl yo'li:** `server/app/models/table.py`, `client/src/pages/TablesPage.tsx`
- **Sabab:** Stollar faqat `is_occupied` bo'lgan, ammo real restoranda stol bo'sh, band, tozalash kutilmoqda yoki rezerv qilingan bo'lishi kerak.
- **Ta'sir:** Ofitsiant va mijozlar uchun stollarning amaldagi holati noto'g'ri ko'rsatilgan.
- **Tuzatish:** `status` ustunini (`available`, `occupied`, `dirty`, `reserved`) kiritish va ofitsiantga stolni tozalashga yuborish imkonini berish.

#### [MED-02] Testlar va sifat nazoratining to'liq yo'qligi
- **Fayl yo'li:** `server/tests/`
- **Sabab:** Backendda birorta ham unit yoki integration test mavjud emas edi.
- **Ta'sir:** O'zgarishlar kiritilganda tizimning buzilish xavfi yuqori.
- **Tuzatish:** `pytest` va `pytest-asyncio` yordamida Auth, RBAC, Orders, Tables, Inventory va Multi-tenancy testlarini yozish.

---

### 🔵 4. LOW (Dizayn, Ergonomika va Texnik Qarz)

#### [LOW-01] Vite konfiguratsiyasidagi eskirgan parametr
- **Fayl yo'li:** `client/vite.config.ts`
- **Sabab:** ESM rejimida `__dirname` ishlatilgan, Vite bu haqda ogohlantirish (warning) berayotgan edi.
- **Tuzatish:** `import.meta.dirname` ga o'zgartirish.

---

## 3. AMALGA OSHIRILADIGAN TUZATISH REJASI

1. **1-qadam:** Backend ma'lumotlar bazasi modellari (`User`, `Tenant`, `Order`, `Table`, `CashShift`, `AuditLog`, `Delivery`) va munosabatlarini kengaytirish va to'g'irlash.
2. **2-qadam:** Backend RBAC va Tenant izolyatsiyasi: Super Admin, Restaurant Admin, Kassir, Oshpaz, Ofitsiant va Kuryer ruxsatlarini mustahkamlash.
3. **3-qadam:** Backend API'larni frontend bilan 100% sinxronlashtirish (`/menu/`, `/inventory/`, `/orders/`, `/tables/`, `/staff/`, `/finance/shifts/`, `/super-admin/`).
4. **4-qadam:** WebSocket'ni `tenant_id` bo'yicha xavfsiz izolyatsiyalash.
5. **5-qadam:** Frontend `authStore` va API clientni haqiqiy backend bilan to'liq integratsiya qilish (haqiqiy JWT sessiya, mock fallback'ni xavfsiz ajratish).
6. **6-qadam:** Frontendda yangi panellarni yaratish:
   - `/super-admin` (Super Admin boshqaruv paneli)
   - `/admin` (Restaurant Admin boshqaruv paneli)
   - `/waiter` (Ofitsiant stollar va buyurtmalar ekrani)
   - `/delivery` (Kuryer buyurtmalar ekrani)
   - Kassa smenasi boshqaruvi dialogi
7. **7-qadam:** Backend va Frontend avtomatlashtirilgan testlarini yozish va ishga tushirish.
8. **8-qadam:** Production deploy, xavfsizlik va foydalanish qo'llanmalarini tayyorlash (`README.md`, `SECURITY.md`, `DEPLOYMENT.md`, `TESTING.md`).
