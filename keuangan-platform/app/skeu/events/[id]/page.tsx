"use client";

import { useState, useEffect, use } from "react";

interface Event {
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

interface FeeComponent {
  id: string;
  eventId: string;
  componentName: string;
  amount: string;
  description: string | null;
}

interface Registration {
  id: string;
  eventId: string;
  studentUserId: string;
  studentNameSnapshot: string | null;
  invoiceId: string | null;
  status: string;
  registeredAt: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [feeComponents, setFeeComponents] = useState<FeeComponent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({ componentName: "", amount: "", description: "" });

  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ studentUserId: "", studentNameSnapshot: "" });

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/skeu/events/${eventId}`);
      const data = await res.json();
      if (data.success) {
        setEvent(data.event);
        setFeeComponents(data.feeComponents || []);
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [eventId]);

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/skeu/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeComponents: [...feeComponents, feeForm],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast("Komponen biaya berhasil ditambahkan");
        setShowFeeModal(false);
        setFeeForm({ componentName: "", amount: "", description: "" });
        await fetchDetail();
      } else {
        setToast(data.error || "Gagal menambahkan komponen biaya");
      }
    } catch (err: any) {
      setToast(err.message);
    }
  };

  const handleAddRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/skeu/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrations: [...registrations, regForm],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast("Peserta berhasil didaftarkan");
        setShowRegModal(false);
        setRegForm({ studentUserId: "", studentNameSnapshot: "" });
        await fetchDetail();
      } else {
        setToast(data.error || "Gagal mendaftarkan peserta");
      }
    } catch (err: any) {
      setToast(err.message);
    }
  };

  const handleGenerateInvoices = async () => {
    try {
      const res = await fetch(`/api/skeu/events/${eventId}/generate-invoices`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setToast(data.message || "Tagihan berhasil dibuat");
        await fetchDetail();
      } else {
        setToast(data.error || "Gagal generate tagihan");
      }
    } catch (err: any) {
      setToast(err.message);
    }
  };

  const totalFee = feeComponents.reduce((sum, fc) => sum + parseFloat(fc.amount || "0"), 0).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎓</span>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">{event?.name || "Detail Event"}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {event?.eventType === "wisuda"
                    ? "Wisuda"
                    : event?.eventType === "seminar"
                      ? "Seminar"
                      : event?.eventType === "pelatihan"
                        ? "Pelatihan"
                        : "Kegiatan Lainnya"}{" "}
                  • {event?.status?.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/skeu/events"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl border border-slate-700 transition"
            >
              ← Kembali
            </a>
            <button
              onClick={handleGenerateInvoices}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow-md transition"
            >
              🧾 Generate Tagihan Massal
            </button>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-10 text-slate-500 text-xs animate-pulse">Memuat detail event...</div>
        ) : !event ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-500 text-sm">Event tidak ditemukan.</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Target Pendapatan</span>
                <div className="text-lg font-black text-white">Rp {Number(event.targetRevenue).toLocaleString("id-ID")}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Estimasi Biaya</span>
                <div className="text-lg font-black text-rose-400">Rp {Number(event.estimatedCost).toLocaleString("id-ID")}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Proyeksi Surplus</span>
                <div className="text-lg font-black text-emerald-400">Rp {Number(event.projectedSurplus).toLocaleString("id-ID")}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Biaya Per Peserta</span>
                <div className="text-lg font-black text-blue-400">Rp {Number(totalFee).toLocaleString("id-ID")}</div>
              </div>
            </div>

            {/* Fee Components */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Komponen Biaya</h3>
                <button
                  onClick={() => setShowFeeModal(true)}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg transition"
                >
                  + Tambah Komponen
                </button>
              </div>

              {feeComponents.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl">
                  <p className="text-slate-500 text-xs">Belum ada komponen biaya.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="pb-3 px-2">Komponen</th>
                        <th className="pb-3 px-2">Nominal</th>
                        <th className="pb-3 px-2">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {feeComponents.map((fc) => (
                        <tr key={fc.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-2 font-bold text-white">{fc.componentName}</td>
                          <td className="py-3 px-2 font-mono text-emerald-400">Rp {Number(fc.amount).toLocaleString("id-ID")}</td>
                          <td className="py-3 px-2 text-slate-400">{fc.description || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {showFeeModal && (
                <form onSubmit={handleAddFee} className="mt-4 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white">Tambah Komponen Biaya</h4>
                  <input
                    required
                    placeholder="Nama komponen (mis. Biaya Wisuda, Toga, Sertifikat)"
                    value={feeForm.componentName}
                    onChange={(e) => setFeeForm({ ...feeForm, componentName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                  />
                  <input
                    required
                    type="number"
                    placeholder="Nominal (Rp)"
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                  />
                  <input
                    placeholder="Keterangan (opsional)"
                    value={feeForm.description}
                    onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFeeModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition">
                      Simpan
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Registrations */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Pendaftaran Peserta</h3>
                <button
                  onClick={() => setShowRegModal(true)}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg transition"
                >
                  + Daftarkan Peserta
                </button>
              </div>

              {registrations.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl">
                  <p className="text-slate-500 text-xs">Belum ada peserta terdaftar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="pb-3 px-2">Nama</th>
                        <th className="pb-3 px-2">User ID</th>
                        <th className="pb-3 px-2">Invoice</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 px-2">Tanggal Daftar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {registrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-2 font-bold text-white">{reg.studentNameSnapshot || "-"}</td>
                          <td className="py-3 px-2 font-mono text-slate-400">{reg.studentUserId.slice(0, 8)}...</td>
                          <td className="py-3 px-2">
                            {reg.invoiceId ? (
                              <span className="text-emerald-400 font-mono">Sudah dibuat</span>
                            ) : (
                              <span className="text-amber-400 font-mono">Belum</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                reg.status === "lunas"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : reg.status === "batal"
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {reg.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-mono text-slate-400">
                            {new Date(reg.registeredAt).toLocaleDateString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {showRegModal && (
                <form onSubmit={handleAddRegistration} className="mt-4 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white">Daftarkan Peserta</h4>
                  <input
                    required
                    placeholder="Student User ID (UUID)"
                    value={regForm.studentUserId}
                    onChange={(e) => setRegForm({ ...regForm, studentUserId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                  />
                  <input
                    required
                    placeholder="Nama Peserta (snapshot)"
                    value={regForm.studentNameSnapshot}
                    onChange={(e) => setRegForm({ ...regForm, studentNameSnapshot: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRegModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition">
                      Daftarkan
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl z-50">
          ✨ {toast}
        </div>
      )}
    </div>
  );
}