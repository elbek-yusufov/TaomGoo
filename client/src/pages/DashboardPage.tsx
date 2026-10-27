import { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  DollarSign,
  AlertTriangle,
  Calendar,
  Sparkles,
  Bot,
  Users,
  Clock,
  ArrowUpRight,
  RefreshCw,
  CheckCircle,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FinanceSummary, ShiftInfo } from '../types';
import { getFinanceSummaryApi, getAnalyticsApi, triggerAiAnalysisApi } from '../features/finance/api';
import { formatMoney } from '../lib/format';

const PAYMENT_COLORS = ['#10B981', '#3B82F6', '#F59E0B']; // Cash, Card, Debt

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState('2026-10-25');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Shift Management State
  const [shift, setShift] = useState<ShiftInfo>({
    isOpen: true,
    openedAt: '2026-10-25T08:00:00Z',
    openedBy: 'Shahnoza Karimova (Kassir)',
    cashInDrawer: 4600000,
    initialCash: 500000,
  });

  // AI Analysis Polling State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState<string>('');
  const [displayedAiText, setDisplayedAiText] = useState<string>('');

  const loadData = async (date: string) => {
    setLoading(true);
    try {
      const data = await getAnalyticsApi(date);
      setSummary(data);
      if (data.ai_summary) {
        setAiText(data.ai_summary);
        setDisplayedAiText(data.ai_summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // Handle AI analysis trigger with 202 Polling every 3s
  const handleTriggerAiAnalysis = async () => {
    setAiLoading(true);
    setDisplayedAiText('');

    try {
      // POST 202
      await triggerAiAnalysisApi(selectedDate);

      // Poll every 3 seconds (up to 60s)
      let attempts = 0;
      const pollInterval = window.setInterval(async () => {
        attempts++;
        try {
          const res = await getAnalyticsApi(selectedDate);
          if (res.ai_summary && attempts >= 2) {
            clearInterval(pollInterval);
            setAiText(res.ai_summary);
            setAiLoading(false);

            // Typing animation effect
            let i = 0;
            const full = res.ai_summary;
            const typer = window.setInterval(() => {
              i += 8;
              setDisplayedAiText(full.slice(0, i));
              if (i >= full.length) clearInterval(typer);
            }, 20);
          }
        } catch (e) {
          console.error(e);
        }

        if (attempts >= 20) {
          clearInterval(pollInterval);
          setAiLoading(false);
          setDisplayedAiText("Tahlil vaqti tugadi, iltimos qaytadan urinib ko'ring.");
        }
      }, 3000);
    } catch (e) {
      console.error(e);
      setAiLoading(false);
    }
  };

  // Toggle Shift
  const handleToggleShift = () => {
    if (shift.isOpen) {
      if (window.confirm("Kassa smenasini yopishni tasdiqlaysizmi? Kassadagi naqd pul qoldig'i hisobga olinadi.")) {
        setShift((prev) => ({ ...prev, isOpen: false }));
      }
    } else {
      setShift((prev) => ({
        ...prev,
        isOpen: true,
        openedAt: new Date().toISOString(),
      }));
    }
  };

  // Recharts data preparation
  const paymentChartData = summary
    ? [
        { name: "Naqd pul", value: summary.revenue_by_payment.cash },
        { name: "Bank kartasi", value: summary.revenue_by_payment.card },
        { name: "Nasiya", value: summary.revenue_by_payment.debt },
      ]
    : [];

  const topFoodsData = summary
    ? summary.top_selling_items.map((item) => ({
        name: item.food__name.replace(/\(.*?\)/g, '').trim(),
        qty: item.total_qty,
        amount: item.total_amount,
      }))
    : [];

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto bg-[#FFF8F0] dark:bg-[#121212]">
      {/* Top Header: Title, Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-stone-900 dark:text-white flex items-center gap-2">
            Moliya va AI Tahlil
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Kunlik tushum, toʻlov usullari, kassa smenasi va sunʼiy intellekt xulosalari
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs shadow-xs">
            <Calendar className="w-4 h-4 text-[#FF5A1F]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-stone-800 dark:text-stone-200 font-semibold focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards (Bugungi tushum, Buyurtmalar, Bekor qilingan, Sof foyda, Kam qolgan masalliqlar) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {/* Bugungi tushum */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Bugungi tushum</span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF5A1F] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-lg md:text-xl text-stone-900 dark:text-white tabular-nums">
            {formatMoney(summary?.total_revenue)}
          </p>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +14% kechagiga nisbatan
          </span>
        </div>

        {/* Jami buyurtmalar */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Buyurtmalar</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-lg md:text-xl text-stone-900 dark:text-white tabular-nums">
            {summary?.total_orders || 0} ta
          </p>
          <span className="text-[10px] text-stone-400 mt-1 block">Oʻrtacha chek: 176 000 soʻm</span>
        </div>

        {/* Bekor qilingan */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Bekor qilingan</span>
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-lg md:text-xl text-red-600 dark:text-red-400 tabular-nums">
            {summary?.total_canceled || 0} ta
          </p>
          <span className="text-[10px] text-stone-400 mt-1 block">4.1% umumiy ulush</span>
        </div>

        {/* Sof foyda */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Sof foyda</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-lg md:text-xl text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatMoney(summary?.net_profit)}
          </p>
          <span className="text-[10px] font-bold text-emerald-500 mt-1 block">Rentabellik: 45.5%</span>
        </div>

        {/* Kam qolgan masalliqlar */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Kam masalliq</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-lg md:text-xl text-amber-600 dark:text-amber-400 tabular-nums">
            {summary?.low_stock_count || 0} ta
          </p>
          <span className="text-[10px] text-amber-500 font-bold mt-1 block">Kirim talab etiladi</span>
        </div>
      </div>

      {/* SHIFT SUMMARY CARD */}
      <div className="mb-6 p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
              shift.isOpen ? 'bg-emerald-500' : 'bg-stone-600'
            }`}
          >
            {shift.isOpen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-base text-stone-900 dark:text-white">
                Kassa Smenasi: {shift.isOpen ? 'Ochiq' : 'Yopiq'}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  shift.isOpen
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {shift.isOpen ? 'Faol smena' : 'Yakunlangan'}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Ochgan: {shift.openedBy} • Boshlangʻich pul: {formatMoney(shift.initialCash)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-stone-400">Kassadagi naqd pul</p>
            <p className="font-heading font-black text-lg text-stone-900 dark:text-white tabular-nums">
              {formatMoney(shift.cashInDrawer)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleShift}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
              shift.isOpen
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
            }`}
          >
            {shift.isOpen ? 'Smenani yopish' : 'Yangi smena ochish'}
          </button>
        </div>
      </div>

      {/* CHARTS ROW: Hourly Revenue (Area) & Payment Type (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Hourly Revenue Area Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-black text-base text-stone-900 dark:text-white">
                Soatbay tushum grafigi
              </h3>
              <p className="text-xs text-stone-400">Restoranning eng qizgʻin soatlari tahlili</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.revenue_by_hour || []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatMoney(val ?? 0), 'Tushum']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#FF5A1F"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Type Donut Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-black text-base text-stone-900 dark:text-white mb-1">
              Toʻlov turlari boʻyicha
            </h3>
            <p className="text-xs text-stone-400 mb-4">Naqd, karta va nasiya toʻlovlari ulushi</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatMoney(val ?? 0)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Naqd pul:
              </span>
              <span className="font-mono font-bold tabular-nums">
                {formatMoney(summary?.revenue_by_payment.cash)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Bank kartasi:
              </span>
              <span className="font-mono font-bold tabular-nums">
                {formatMoney(summary?.revenue_by_payment.card)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Nasiya:
              </span>
              <span className="font-mono font-bold tabular-nums">
                {formatMoney(summary?.revenue_by_payment.debt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW: Top 5 Foods (Bar Chart) & Waiters Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Top 5 Foods */}
        <div className="lg:col-span-6 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <h3 className="font-heading font-black text-base text-stone-900 dark:text-white mb-1">
            Top-5 Eng koʻp sotilgan taomlar
          </h3>
          <p className="text-xs text-stone-400 mb-4">Porsiya hisobida kunlik yetakchilar</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFoodsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val ?? 0} porsiya`, 'Miqdor']} />
                <Bar dataKey="qty" fill="#FF5A1F" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waiters Leaderboard */}
        <div className="lg:col-span-6 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-black text-base text-stone-900 dark:text-white">
                Ofitsiantlar reytingi
              </h3>
              <p className="text-xs text-stone-400">Buyurtmalar soni, tushum va xizmat haqi</p>
            </div>
            <Users className="w-5 h-5 text-stone-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 uppercase tracking-wider text-[10px] text-stone-500">
                <tr>
                  <th className="py-2.5 px-3">Ofitsiant</th>
                  <th className="py-2.5 px-3 text-center">Buyurtmalar</th>
                  <th className="py-2.5 px-3">Jami savdo</th>
                  <th className="py-2.5 px-3 text-right">Xizmat haqi (10%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {summary?.waiters.map((w, idx) => (
                  <tr key={w.name}>
                    <td className="py-2.5 px-3 font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[10px] font-bold text-[#FF5A1F]">
                        {idx + 1}
                      </span>
                      <span>{w.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold font-mono">{w.orders_count} ta</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-900 dark:text-white tabular-nums">
                      {formatMoney(w.total_revenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatMoney(w.service_fee)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI MASLAHATCHI CARD (202 polling, typing animation, markdown render) */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white p-6 rounded-3xl border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5A1F] flex items-center justify-center text-white shadow-lg shadow-[#FF5A1F]/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-xl flex items-center gap-2">
                TaomGo AI Maslahatchi
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-stone-300 font-mono">
                  Gemini Flash 2.5
                </span>
              </h3>
              <p className="text-xs text-stone-400">Kunlik moliya, ombor sarfi va rentabellik xulosasi</p>
            </div>
          </div>

          <button
            type="button"
            disabled={aiLoading}
            onClick={handleTriggerAiAnalysis}
            className="px-5 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#FF5A1F]/30 transition-all cursor-pointer self-start sm:self-auto"
          >
            {aiLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> AI tahlil olinmoqda...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> AI tahlil olish (202)
              </>
            )}
          </button>
        </div>

        {/* AI Output Content */}
        {aiLoading ? (
          <div className="py-8 space-y-3">
            <div className="h-4 bg-stone-800 rounded-md w-3/4 animate-pulse" />
            <div className="h-4 bg-stone-800 rounded-md w-5/6 animate-pulse" />
            <div className="h-4 bg-stone-800 rounded-md w-2/3 animate-pulse" />
            <p className="text-xs text-stone-400 pt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5A1F] animate-ping" />
              Tizim maʼlumotlari toʻplanib, sunʼiy intellekt tomonidan qayta ishlanmoqda...
            </p>
          </div>
        ) : (
          <div className="bg-stone-950/70 p-5 rounded-2xl border border-stone-800/80 font-mono text-xs text-stone-300 whitespace-pre-line leading-relaxed">
            {displayedAiText || aiText || "AI tahlil olish tugmasini bosing..."}
          </div>
        )}
      </div>
    </div>
  );
}
