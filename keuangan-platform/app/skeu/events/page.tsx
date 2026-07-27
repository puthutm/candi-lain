"use client";

import { useState, useEffect } from "react";

interface PaidEvent {
  id: string;
  name: string;
  eventType: string;
  targetRevenue: string;
  estimatedCost: string;
  projectedSurplus: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
}

export default function EventsPage() {
  const [events, setEvents] = useState<PaidEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", eventType: "wisuda", targetRevenue: "", estimatedCost: "", startDate: "", endDate: "", notes: "" });
  const [toast, setToast] = useState("");

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/skeu/events");
      const data = await res.json();
      if (data.success) setEvents(data.events || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/skeu/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setToast("Event berhasil dibuat!");
        setShowModal(false);
        setForm({ name: "", eventType: "wisuda", targetRevenue: "", estimatedCost: "", startDate: "", endDate: "", notes: "" });
        await fetchEvents();
      } else {
        setToast(data.error || "Gagal membuat event");
      }
    } catch (err: any) { setToast(err.message); }
  };

  const typeLabel: Record<string, string> = { wisuda: "Wisuda", seminar: "Seminar", pelatihan: "Pelatihan", lainnya: "Kegiatan Lainnya" };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Event & Kegiatan Berbayar</h1>
              <p className="text-xs text-slate-400 mt-1">Wisuda, Seminar, Pelatihan — Kelola biaya & tagihan peserta</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md">
            + Buat Event Baru
          </button>
        </header>

        {loading ? (
          <div className="text-center py-10 text-slate-500 text-xs animate-pulse">Memuat data event...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl">
            <span className="text-4xl block mb-3">📅</span>
            <p className="text-slate-500 text-sm">Belum ada event. Klik "Buat Event Baru" untuk memulai.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((ev) => (
              <a key={ev.id} href={`/skeu/events/${ev.id}`} className="block">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between hover:border-slate-700 transition">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{ev.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{ev.status.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-slate-400">{typeLabel[ev.eventType] || ev.eventType}</p>
                    {ev.startDate && <p className="text-[10px] text-slate-500">{ev.startDate} {ev.endDate ? `- ${ev.endDate}` : ""}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">Target: Rp {Number(ev.targetRevenue).toLocaleString("id-ID")}</div>
                    <div className="text-[10px] text-slate-400">Surplus: Rp {Number(ev.projectedSurplus).toLocaleString("id-ID")}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-white text-sm">🎓 Buat Event Baru</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <input required placeholder="Nama Event" value={form.name} onChange={(e) => setForm({...form, name:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
                <select value={form.eventType} onChange={(e) => setForm({...form, eventType:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600">
                  <option value="wisuda">Wisuda</option>
                  <option value="seminar">Seminar</option>
                  <option value="pelatihan">Pelatihan</option>
                  <option value="lainnya">Lainnya</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Target Pendapatan" value={form.targetRevenue} onChange={(e) => setForm({...form, targetRevenue:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
                  <input placeholder="Estimasi Biaya" value={form.estimatedCost} onChange={(e) => setForm({...form, estimatedCost:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
                  <input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
                </div>
                <textarea placeholder="Catatan (opsional)" value={form.notes} onChange={(e) => setForm({...form, notes:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600 h-20" />
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl">Simpan Event</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && (<div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl z-50">✨ {toast}</div>)}
      </div>
    </div>
  );
}
