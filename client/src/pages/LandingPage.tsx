import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  Sparkles,
  CreditCard,
  ChefHat,
  LayoutGrid,
  Boxes,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { FoodHeroScene } from '../components/three/FoodHeroScene';
import { formatMoney } from '../lib/format';

export function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Auto-cycle storytelling steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    {
      title: '1. Tezkor buyurtma (Kassa)',
      desc: 'Mijoz zalda yoki olib ketishga buyurtma beradi. Kassir 3 soniyada taomlarni savatchaga soladi va stolga biriktiradi.',
      badge: '00:03 sek',
      icon: CreditCard,
      color: 'from-orange-500 to-amber-500',
    },
    {
      title: '2. Real-time Oshxona (KDS)',
      desc: 'Buyurtma shu zahotiyoq oshpaz ekranga tushadi. Stansiyalar (Oshxona, Mangal, Bar) boʻyicha ajratiladi va taymer sanaydi.',
      badge: 'Jonli efir',
      icon: ChefHat,
      color: 'from-amber-500 to-red-500',
    },
    {
      title: '3. Retsept boʻyicha Ombor',
      desc: 'Har bir tayyorlangan taom tarkibidagi goʻsht, guruch, sabzi avtomatik ombordan hisobdan chiqariladi. Chiqindi va isrof nazoratda.',
      badge: 'Avtomatlashtirilgan',
      icon: Boxes,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: '4. Moliya va AI Tahlil',
      desc: 'Kunlik tushum, sof foyda, ofitsiantlar reytingi va qaysi masalliq tugayotganini AI maslahatchi tahlil qilib hisobot beradi.',
      badge: 'AI Smart',
      icon: BarChart3,
      color: 'from-blue-500 to-indigo-500',
    },
  ];

  const features = [
    {
      icon: CreditCard,
      title: 'Tezkor Kassa (POS)',
      desc: 'Sensorli ekran, qidiruv (Ctrl+K), zal va olib ketish rejimlari, naqd, karta va nasiya toʻlovlari.',
    },
    {
      icon: ChefHat,
      title: 'Real-time Oshxona (KDS)',
      desc: 'WebSocket orqali soniyali yangilanish, oʻz vaqtida ogohlantirish (5 va 10 daqiqa), audio signallar.',
    },
    {
      icon: LayoutGrid,
      title: 'Stollar Xaritasi',
      desc: 'Zallar boʻyicha vizual joylashuv, boʻsh va band holatlar, 3D izometrik koʻrinish.',
    },
    {
      icon: Boxes,
      title: 'Ombor va Retseptlar',
      desc: 'Xomashyo kirimi, porsiyali kalkulyatsiya, sof foyda marjasi va kam qolgan masalliq signallari.',
    },
    {
      icon: BarChart3,
      title: 'Moliya va Smena',
      desc: 'Kassadagi naqd pul, soatlik tushum grafiklari, ofitsiantlar reytingi va kassa smenalari.',
    },
    {
      icon: Bot,
      title: 'AI Maslahatchi',
      desc: 'Restoranning rentabelligini oshirish, xaridlar rejasini tuzish va tavsiyalar beruvchi aqlli tizim.',
    },
  ];

  const plans = [
    {
      name: 'Boshlangʻich',
      tag: 'Kichik oshxona va kafelar uchun',
      price: 290000,
      period: "oyiga",
      features: ['1 ta kassa terminali', 'Oshxona ekrani (KDS)', 'Cheksiz menyu va taomlar', 'Oddiy moliya hisoboti'],
      highlighted: false,
    },
    {
      name: 'Standart',
      tag: 'Eng mashhur tanlov',
      price: 590000,
      period: "oyiga",
      features: [
        'Cheksiz kassa va ofitsiantlar',
        'Stollar xaritasi va 3D reja',
        'Ombor va avtomatik retseptlar',
        'Telegram bot xabarnomalari',
        'Real-time WebSocket ulanish',
      ],
      highlighted: true,
    },
    {
      name: 'Professional + AI',
      tag: 'Katta restoran va tarmoqlar uchun',
      price: 990000,
      period: "oyiga",
      features: [
        'Standart reja imkoniyatlari',
        'AI Kundalik tahlil va maslahatchi',
        'Koʻp zalli va tarmoq boshqaruvi',
        '24/7 shaxsiy menejer',
        '80mm termal chek printer integratsiyasi',
      ],
      highlighted: false,
    },
  ];

  const faqs = [
    {
      q: "TaomGo qanday qurilmalarda ishlaydi?",
      a: "TaomGo har qanday zamonaviy brauzerda ishlaydi: noutbuk, Android va iPad planshetlar, sensorli monobloklar va smartfonlar. Hech qanday murakkab server oʻrnatish talab etilmaydi.",
    },
    {
      q: "Oflayn rejimda ishlash mumkinmi?",
      a: "Ha, PWA texnologiyasi yordamida internet uzilganda ham kassa va stollar xotirada saqlanadi va aloqa tiklanganda avtomatik sinxronlanadi.",
    },
    {
      q: "Chek chiqarish uchun qaysi printerlar mos keladi?",
      a: "Barcha standart 80mm va 58mm termal chek printerlari (USB, LAN, Bluetooth) toʻgʻridan-toʻgʻri qoʻllab-quvvatlanadi.",
    },
    {
      q: "Oshpazlar uchun buyurtmalar qanday koʻrinadi?",
      a: "Oshxona (KDS) ekrani buyurtmalarni kanban doska shaklida (Yangi, Tayyorlanmoqda, Tayyor) koʻrsatadi. Har bir buyurtmada tayyorlanish vaqti sanaladi.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F0] dark:bg-[#121212] text-stone-900 dark:text-stone-100 flex flex-col selection:bg-[#FF5A1F] selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#FFF8F0]/90 dark:bg-[#121212]/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A1F] to-[#FF8A48] flex items-center justify-center text-white shadow-lg shadow-[#FF5A1F]/25">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <span className="font-heading font-black text-2xl tracking-tight text-stone-900 dark:text-white">
            Taom<span className="text-[#FF5A1F]">Go</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-300">
          <a href="#how-it-works" className="hover:text-[#FF5A1F] transition-colors">
            Qanday ishlaydi
          </a>
          <a href="#features" className="hover:text-[#FF5A1F] transition-colors">
            Imkoniyatlar
          </a>
          <a href="#pricing" className="hover:text-[#FF5A1F] transition-colors">
            Tariflar
          </a>
          <a href="#faq" className="hover:text-[#FF5A1F] transition-colors">
            Savollar
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-stone-700 dark:text-stone-200 hover:text-[#FF5A1F] font-semibold text-sm transition-colors"
          >
            Kirish
          </Link>
          <Link
            to="/pos"
            className="px-5 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-semibold text-sm shadow-md shadow-[#FF5A1F]/25 transition-all flex items-center gap-1.5"
          >
            Demo koʻrish <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* HERO SECTION with 3D Centerpiece */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden px-4 md:px-8 py-12">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6 z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900/60 text-[#FF5A1F] text-xs font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Oʻzbekiston umumiy ovqatlanish korxonalari uchun maxsus
            </div>

            <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl text-stone-900 dark:text-white tracking-tight leading-[1.1] mb-6">
              Kafengizni bir joydan <span className="text-[#FF5A1F]">boshqaring</span>.
            </h1>

            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-xl mb-8 leading-relaxed">
              Tezkor sensorli kassa, oshxona (KDS) ekrani, stollar xaritasi, porsiyali retseptlar ombori va sunʼiy intellektga
              asoslangan kunlik moliyaviy tahlil.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                to="/pos"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-base shadow-xl shadow-[#FF5A1F]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Kassani ochish <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/kitchen"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-semibold text-base hover:border-[#FF5A1F]/50 transition-all flex items-center justify-center gap-2"
              >
                <ChefHat className="w-5 h-5 text-[#FF5A1F]" /> Oshxona KDS
              </Link>
            </div>

            {/* Quick stats highlight */}
            <div className="mt-12 pt-6 border-t border-stone-200/80 dark:border-stone-800 grid grid-cols-3 gap-4">
              <div>
                <p className="font-heading font-black text-2xl text-stone-900 dark:text-white">3 soniya</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Buyurtma berish</p>
              </div>
              <div>
                <p className="font-heading font-black text-2xl text-[#FF5A1F]">100%</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Ombor nazorati</p>
              </div>
              <div>
                <p className="font-heading font-black text-2xl text-stone-900 dark:text-white">AI maslahat</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Kunlik foyda tahlili</p>
              </div>
            </div>
          </div>

          {/* Right 3D Visual */}
          <div className="lg:col-span-6 h-[420px] md:h-[540px] relative flex items-center justify-center">
            <FoodHeroScene />
          </div>
        </div>
      </section>

      {/* SECTION 1: "Buyurtma → Oshxona → Ombor → Hisobot" Storytelling */}
      <section id="how-it-works" className="py-20 px-4 md:px-8 bg-stone-100/60 dark:bg-stone-900/40 border-y border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-wider text-[#FF5A1F] mb-2">Toʻliq tsikl</p>
            <h2 className="font-heading font-black text-3xl md:text-4xl text-stone-900 dark:text-white">
              Buyurtmadan moliyaviy hisobotgacha
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <div
                  key={step.title}
                  onClick={() => setActiveStep(idx)}
                  className={`cursor-pointer p-6 rounded-2xl transition-all border ${
                    isActive
                      ? 'bg-white dark:bg-stone-800 shadow-xl border-[#FF5A1F] scale-105'
                      : 'bg-white/60 dark:bg-stone-800/50 border-stone-200/80 dark:border-stone-700/60 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2: 6 Features Grid */}
      <section id="features" className="py-20 px-4 md:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-wider text-[#FF5A1F] mb-2">Imkoniyatlar</p>
          <h2 className="font-heading font-black text-3xl md:text-4xl text-stone-900 dark:text-white mb-4">
            Zamonaviy restoran uchun barcha modullar
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Har bir funksiya Oʻzbekiston ovqatlanish sohasi xususiyatlari va milliy taomlar retsepturasini hisobga olgan holda yaratilgan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-[#FF5A1F]/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-[#FF5A1F] flex items-center justify-center mb-4 group-hover:bg-[#FF5A1F] group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Live Kitchen Demo Strip */}
      <section className="py-16 px-4 md:px-8 bg-stone-900 text-white overflow-hidden relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-[#FF5A1F] block mb-1">Jonli KDS Demo</span>
              <h3 className="font-heading font-bold text-2xl">Oshxona buyurtmalarining real-time oqimi</h3>
            </div>
            <Link
              to="/kitchen"
              className="px-4 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-medium text-xs self-start md:self-auto flex items-center gap-2"
            >
              Toʻliq oshxona ekraniga oʻtish <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700/80">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-700">
                <span className="font-bold text-sm text-blue-400">Yangi (1)</span>
                <span className="text-[10px] text-stone-400">Hozirgina tushdi</span>
              </div>
              <div className="bg-stone-900 p-3 rounded-lg border border-stone-800">
                <div className="flex justify-between font-bold text-sm">
                  <span>#103 • Stol #5</span>
                  <span className="text-xs text-stone-400">01:42</span>
                </div>
                <p className="text-xs text-stone-300 mt-1">5x Toshkent toʻy oshi, 8x Somsa</p>
              </div>
            </div>

            <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700/80">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-700">
                <span className="font-bold text-sm text-amber-400">Tayyorlanmoqda (2)</span>
                <span className="text-[10px] text-stone-400">Mangal & Qozon</span>
              </div>
              <div className="bg-stone-900 p-3 rounded-lg border border-stone-800">
                <div className="flex justify-between font-bold text-sm">
                  <span>#101 • Stol #1</span>
                  <span className="text-xs text-amber-400">07:15</span>
                </div>
                <p className="text-xs text-stone-300 mt-1">2x Osh, 2x Somsa, 2x Koʻk choy</p>
              </div>
            </div>

            <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700/80">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-700">
                <span className="font-bold text-sm text-emerald-400">Tayyor (1)</span>
                <span className="text-[10px] text-stone-400">Ofitsiantga chaqiruv</span>
              </div>
              <div className="bg-stone-900 p-3 rounded-lg border border-stone-800">
                <div className="flex justify-between font-bold text-sm">
                  <span>#104 • Stol #8</span>
                  <span className="text-xs text-emerald-400">Tayyor</span>
                </div>
                <p className="text-xs text-stone-300 mt-1">3x Goʻshtli manti, 2x Suzma</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: AI Insight Preview */}
      <section className="py-20 px-4 md:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white p-8 md:p-12 border border-stone-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF5A1F]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#FF5A1F] flex items-center justify-center text-white shadow-lg shadow-[#FF5A1F]/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-black text-xl md:text-2xl">TaomGo AI Maslahatchi</h3>
              <p className="text-xs text-stone-400">Oshpaz va menejer uchun aqlli assistent</p>
            </div>
          </div>

          <div className="bg-stone-950/80 rounded-2xl p-6 border border-stone-800 font-mono text-xs md:text-sm text-stone-300 leading-relaxed space-y-4">
            <div className="flex items-center gap-2 text-[#FF5A1F] font-bold">
              <Sparkles className="w-4 h-4" /> Kunlik tahlil natijasi:
            </div>
            <p>
              «Bugun tushlik vaqtida (12:00-14:00) jami savdoning 51% qismi amalga oshirildi. <strong>Toshkent toʻy oshi</strong> 64 porsiya sotildi.»
            </p>
            <p className="text-amber-400 bg-amber-950/40 p-3 rounded-lg border border-amber-900/50">
              ⚠️ <strong>Ombor ogohlantirishi:</strong> Mol lahm goʻshti (12.5 kg qoldi) va sariq sabzi (18 kg qoldi) minimal zaxiradan kam. Ertangi tushlik uchun zudlik bilan 25 kg goʻsht kirim qilish tavsiya etiladi.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              to="/finance"
              className="px-5 py-2.5 rounded-xl bg-white text-stone-900 font-bold text-xs hover:bg-stone-200 transition-colors inline-flex items-center gap-2"
            >
              Moliya panelida koʻrish <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5: Pricing */}
      <section id="pricing" className="py-20 px-4 md:px-8 bg-stone-100/60 dark:bg-stone-900/40 border-y border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-wider text-[#FF5A1F] mb-2">Shaffof narxlar</p>
            <h2 className="font-heading font-black text-3xl md:text-4xl text-stone-900 dark:text-white mb-3">
              Kafengiz hajmiga mos tariflar
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Yashirin toʻlovlarsiz. Har qanday vaqtda bekor qilish yoki tarifni oʻzgartirish mumkin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all ${
                  plan.highlighted
                    ? 'bg-white dark:bg-stone-800 border-2 border-[#FF5A1F] shadow-2xl relative scale-105'
                    : 'bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#FF5A1F] text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                    Tavsiya etiladi
                  </span>
                )}
                <div>
                  <h3 className="font-heading font-bold text-2xl text-stone-900 dark:text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">{plan.tag}</p>

                  <div className="mb-6">
                    <span className="font-heading font-black text-3xl md:text-4xl text-stone-900 dark:text-white">
                      {formatMoney(plan.price)}
                    </span>
                    <span className="text-xs text-stone-400 ml-1">/ {plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8 text-xs md:text-sm text-stone-600 dark:text-stone-300">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/pos"
                  className={`w-full py-3 rounded-xl font-bold text-sm text-center transition-all ${
                    plan.highlighted
                      ? 'bg-[#FF5A1F] hover:bg-[#E4480E] text-white shadow-lg shadow-[#FF5A1F]/25'
                      : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-100'
                  }`}
                >
                  Hoziroq boshlash
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: FAQ Accordion */}
      <section id="faq" className="py-20 px-4 md:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-[#FF5A1F] mb-2">Koʻp beriladigan savollar</p>
          <h2 className="font-heading font-black text-3xl text-stone-900 dark:text-white">Savollaringiz bormi?</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={faq.q}
              className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full text-left p-5 font-heading font-bold text-base text-stone-900 dark:text-white flex items-center justify-between cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform ${expandedFaq === idx ? 'rotate-180 text-[#FF5A1F]' : ''}`}
                />
              </button>
              {expandedFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-800/60">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-r from-[#FF5A1F] to-[#E4480E] text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading font-black text-3xl md:text-5xl mb-4">
            Restoraningiz boshqaruvini bugunoq yangi bosqichga olib chiqing
          </h2>
          <p className="text-base md:text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            14 kunlik bepul sinov davri. Kartasiz va hech qanday majburiyatsiz sinab koʻring.
          </p>
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-[#FF5A1F] font-bold text-base shadow-2xl hover:bg-stone-100 transition-all hover:scale-105 active:scale-95"
          >
            Tizimni sinab koʻrish <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 md:px-8 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#FF5A1F]" />
          <span className="font-heading font-bold text-stone-700 dark:text-stone-200">TaomGo POS</span>
          <span>© 2026 Barcha huquqlar himoyalangan. Toshkent, Oʻzbekiston.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/pos" className="hover:text-[#FF5A1F]">Kassa</Link>
          <Link to="/kitchen" className="hover:text-[#FF5A1F]">Oshxona</Link>
          <Link to="/tables" className="hover:text-[#FF5A1F]">Stollar</Link>
          <Link to="/login" className="hover:text-[#FF5A1F]">Kirish</Link>
        </div>
      </footer>
    </div>
  );
}
