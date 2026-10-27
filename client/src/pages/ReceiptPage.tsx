import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, CheckCircle, Flame } from 'lucide-react';
import { Order } from '../types';
import { getOrderByIdApi } from '../features/orders/api';
import { useAuthStore } from '../stores/authStore';
import { formatMoney, formatDateTime } from '../lib/format';

export function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      try {
        const ord = await getOrderByIdApi(id);
        setOrder(ord);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-stone-400 text-xs">
        Chek yuklanmoqda...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <p className="font-heading font-bold text-lg mb-4 text-stone-800 dark:text-stone-200">
          Buyurtma topilmadi
        </p>
        <button
          type="button"
          onClick={() => navigate('/pos')}
          className="px-4 py-2 rounded-xl bg-[#FF5A1F] text-white text-xs font-bold"
        >
          Kassaga qaytish
        </button>
      </div>
    );
  }

  const tenant = user?.tenant || {
    name: 'Rayhon Milliy Taomlar',
    address: 'Toshkent sh., Chilonzor tumani, 9-mavze, 24-uy',
    phone: '+998 71 200 45 45',
  };

  return (
    <div className="min-h-full p-4 sm:p-8 flex flex-col items-center justify-start bg-stone-100 dark:bg-stone-950">
      {/* Top Action Bar (hidden when printing) */}
      <div className="w-full max-w-[80mm] mb-4 flex items-center justify-between no-print">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#FF5A1F]/20 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Chop etish
        </button>
      </div>

      {/* 80mm THERMAL RECEIPT CONTAINER */}
      <div
        id="thermal-receipt"
        className="w-[80mm] bg-white text-black p-4 font-mono text-[12px] leading-tight shadow-xl border border-stone-200 rounded-sm"
      >
        {/* Header */}
        <div className="text-center pb-3 border-b border-dashed border-stone-400 space-y-1">
          <div className="flex items-center justify-center gap-1 font-sans font-black text-base tracking-tight">
            <span>Taom</span>
            <span className="text-[#FF5A1F]">Go</span>
          </div>
          <p className="font-bold text-[13px]">{tenant.name}</p>
          <p className="text-[10px] text-stone-600">{tenant.address}</p>
          <p className="text-[10px] text-stone-600">Tel: {tenant.phone}</p>
        </div>

        {/* Order Meta Info */}
        <div className="py-2.5 border-b border-dashed border-stone-400 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>Buyurtma:</span>
            <span className="font-bold text-[13px]">#{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Sana:</span>
            <span>{formatDateTime(order.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Joy / Telefon:</span>
            <span className="font-semibold">{order.table_or_phone}</span>
          </div>
          <div className="flex justify-between">
            <span>Ofitsiant:</span>
            <span>{order.waiter_name}</span>
          </div>
        </div>

        {/* Item Lines */}
        <div className="py-2.5 border-b border-dashed border-stone-400 space-y-2">
          <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-stone-200">
            <span>Taom</span>
            <span>Jami</span>
          </div>

          {order.items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="font-semibold">{item.food_name}</div>
              <div className="flex justify-between text-stone-600 text-[11px]">
                <span>
                  {item.quantity} x {formatMoney(item.unit_price)}
                </span>
                <span className="font-bold text-black tabular-nums">{formatMoney(item.line_total)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Calculation summary */}
        <div className="py-2.5 border-b border-dashed border-stone-400 space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span>Oraliq jami:</span>
            <span className="font-semibold tabular-nums">{formatMoney(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Xizmat haqi ({order.service_fee_percent}%):</span>
            <span className="tabular-nums">{formatMoney(order.service_fee_amount)}</span>
          </div>
          <div className="flex justify-between text-base font-black pt-1 border-t border-stone-300">
            <span>JAMI:</span>
            <span className="tabular-nums">{formatMoney(order.total_price)}</span>
          </div>
        </div>

        {/* Payment Type */}
        <div className="py-2 border-b border-dashed border-stone-400 flex justify-between text-[11px] font-bold">
          <span>Toʻlov turi:</span>
          <span className="uppercase">
            {order.payment_type === 'cash' ? '💵 Naqd pul' : order.payment_type === 'card' ? '💳 Bank kartasi' : '📝 Nasiya'}
          </span>
        </div>

        {/* Footer */}
        <div className="text-center pt-3 text-[10px] space-y-1 text-stone-600">
          <p className="font-semibold text-black">Tashrifingiz uchun rahmat!</p>
          <p>Yoqimli ishtaha tilaymiz!</p>
          <p className="text-[9px] text-stone-400 font-mono pt-1">TaomGo POS tizimi orqali chop etildi</p>
        </div>
      </div>
    </div>
  );
}
