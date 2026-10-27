import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, Phone, UserCheck, X } from 'lucide-react';
import { StaffMember, getStaffListApi, createStaffApi, updateStaffApi, deleteStaffApi } from '../features/staff/api';
import { Role } from '../types';

export function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<Role>('cashier');
  const [formPhone, setFormPhone] = useState('+998 90 123 45 67');

  const loadStaff = async () => {
    try {
      const data = await getStaffListApi();
      setStaff(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const openCreateModal = () => {
    setEditingMember(null);
    setFormUsername('');
    setFormFullName('');
    setFormRole('cashier');
    setFormPhone('+998 90 000 00 00');
    setModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingMember(member);
    setFormUsername(member.username);
    setFormFullName(member.full_name);
    setFormRole(member.role);
    setFormPhone(member.phone);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await updateStaffApi(editingMember.id, {
          username: formUsername,
          full_name: formFullName,
          role: formRole,
          phone: formPhone,
        });
      } else {
        await createStaffApi({
          username: formUsername,
          full_name: formFullName,
          role: formRole,
          phone: formPhone,
          status: 'active',
        });
      }
      await loadStaff();
      setModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`"${name}" xodimini oʻchirishni tasdiqlaysizmi?`)) {
      try {
        await deleteStaffApi(id);
        await loadStaff();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto bg-[#FFF8F0] dark:bg-[#121212]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-stone-900 dark:text-white flex items-center gap-2">
            Xodimlar va Ruxsatlar
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Kassirlar, oshpazlar va boshqaruvchilar hisoblari
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#FF5A1F]/30"
        >
          <Plus className="w-4 h-4" /> Yangi xodim qoʻshish
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 uppercase text-[10px] text-stone-500 font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Xodim</th>
                <th className="py-3 px-4">Login</th>
                <th className="py-3 px-4">Roli</th>
                <th className="py-3 px-4">Telefon</th>
                <th className="py-3 px-4">Holat</th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {staff.map((m) => (
                <tr key={m.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#FF5A1F] font-bold text-xs flex items-center justify-center uppercase">
                        {m.username.slice(0, 2)}
                      </div>
                      <span className="font-heading font-bold text-stone-900 dark:text-white">{m.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-stone-500">@{m.username}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                        m.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : m.role === 'cashier'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {m.role === 'admin' ? 'Boshqaruvchi' : m.role === 'cashier' ? 'Kassir' : 'Oshpaz'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-stone-600 dark:text-stone-300">{m.phone}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Faol
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(m)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id, m.full_name)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-500"
                        title="Oʻchirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add/Edit Staff */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-heading font-black text-lg text-stone-900 dark:text-white">
                {editingMember ? "Xodimni tahrirlash" : "Yangi xodim qoʻshish"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">F.I.SH</label>
              <input
                type="text"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                placeholder="Jasur Rahmonov"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Foydalanuvchi nomi (Login)
              </label>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="jasur_pos"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Roli</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as Role)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
              >
                <option value="cashier">Kassir (Kassa & Stollar)</option>
                <option value="chef">Oshpaz (Oshxona & Stollar)</option>
                <option value="admin">Boshqaruvchi (Toʻliq kirish)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Telefon</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm font-mono"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-500 text-xs font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-xs"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
