"use client";

import React, { useState, useEffect } from "react";

export interface EntryPathRow {
  id: string;
  name: string;
  code: string;
  formFee: string;
  isFree: boolean;
}

interface JalurMasukPanelProps {
  triggerToast: (msg: string) => void;
  refreshData?: () => void;
}

export default function JalurMasukPanel({ triggerToast, refreshData }: JalurMasukPanelProps) {
  const [entryPaths, setEntryPaths] = useState<EntryPathRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    formFee: "250000",
    isFree: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntryPaths = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/entry-paths");
      const data = await res.json();
      if (data.success && data.entryPaths) {
        setEntryPaths(data.entryPaths);
      } else {
        setError(data.error || "Gagal mengambil data Jalur Masuk");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntryPaths();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      formFee: "250000",
      isFree: false,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: EntryPathRow) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      code: item.code,
      formFee: String(item.formFee || 0),
      isFree: !!item.isFree,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      triggerToast("Nama dan Kode Jalur Masuk wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!editingId;
      const url = "/api/admin/entry-paths";
      const method = isEdit ? "PATCH" : "POST";
      const payload = isEdit ? { id: editingId, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        triggerToast(isEdit ? "Jalur masuk berhasil diperbarui!" : "Jalur masuk baru berhasil ditambahkan!");
        setShowModal(false);
        fetchEntryPaths();
        if (refreshData) refreshData();
      } else {
        triggerToast("Gagal menyimpan jalur masuk: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Jalur Masuk ${name}?`)) return;

    try {
      const res = await fetch(`/api/admin/entry-paths?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Jalur Masuk ${name} berhasil dihapus.`);
        fetchEntryPaths();
        if (refreshData) refreshData();
      } else {
        triggerToast("Gagal menghapus jalur masuk: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    }
  };

  return (
    <div className="space-y-6 fade-in pb-10">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              Manajemen Jenis & Jalur Masuk PMB
            </h2>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
              Master Data Jalur
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pilihan Jalur Masuk calon mahasiswa baru (Reguler, Beasiswa, Prestasi, Transfer, Mitra, dll) & biaya formulirnya.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEntryPaths}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer flex items-center gap-1"
          >
            <span>🔄</span> Refresh
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span> Tambah Jalur Masuk Baru
          </button>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
            Memuat data Jalur Masuk...
          </div>
        ) : error ? (
          <div className="col-span-full p-8 text-center text-red-500 font-medium bg-white rounded-2xl border border-slate-200">
            Gagal memuat data: {error}
          </div>
        ) : entryPaths.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
            Belum ada Jalur Masuk yang terdaftar. Klik <strong>+ Tambah Jalur Masuk Baru</strong>.
          </div>
        ) : (
          entryPaths.map((ep) => (
            <div key={ep.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold">
                    {ep.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-800 mt-1">{ep.name}</h3>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                    ep.isFree ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {ep.isFree ? "Gratis / Beasiswa" : "Berbayar"}
                </span>
              </div>

              <div className="text-slate-600 space-y-1 font-medium text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Biaya Formulir:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {ep.isFree ? "Gratis (Rp 0)" : `Rp ${Number(ep.formFee || 0).toLocaleString("id-ID")}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(ep)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 cursor-pointer"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(ep.id, ep.name)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 cursor-pointer"
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? "Edit Jalur Masuk PMB" : "Tambah Jalur Masuk Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Nama Jalur Masuk</label>
                <input
                  type="text"
                  required
                  placeholder="Reguler Raport / Beasiswa Unggulan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block mb-1">Kode Jalur (Singkatan/Unik)</label>
                <input
                  type="text"
                  required
                  placeholder="REG-RPRT / BEA-UNGGUL"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block mb-1">Biaya Formulir (Rp)</label>
                <input
                  type="number"
                  required={!formData.isFree}
                  disabled={formData.isFree}
                  placeholder="250000"
                  value={formData.isFree ? 0 : formData.formFee}
                  onChange={(e) => setFormData({ ...formData, formFee: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-blue-600 disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked, formFee: e.target.checked ? "0" : formData.formFee })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isFree" className="cursor-pointer font-bold text-slate-800">
                  Jalur Gratis Biaya Pendaftaran (Beasiswa / Promo)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Jalur Masuk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
