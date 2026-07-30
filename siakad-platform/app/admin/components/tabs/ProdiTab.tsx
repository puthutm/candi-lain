"use client";

import React, { useState, useEffect } from "react";

export interface StudyProgramRow {
  id: string;
  name: string;
  code?: string;
  faculty: string;
  degreeLevel: string;
}

interface ProdiTabProps {
  triggerToast?: (msg: string) => void;
}

export default function ProdiTab({ triggerToast }: ProdiTabProps) {
  const [prodis, setProdis] = useState<StudyProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    faculty: "Fakultas Teknologi Informasi",
    degreeLevel: "S1",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProdis = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/study-programs");
      const data = await res.json();
      if (data.success && data.studyPrograms) {
        setProdis(data.studyPrograms);
      } else {
        setError(data.error || "Gagal mengambil data Program Studi");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdis();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      faculty: "Fakultas Teknologi Informasi",
      degreeLevel: "S1",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prodi: StudyProgramRow) => {
    setEditingId(prodi.id);
    setFormData({
      name: prodi.name,
      code: prodi.code || "",
      faculty: prodi.faculty || "FTI",
      degreeLevel: prodi.degreeLevel || "S1",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.faculty) {
      if (triggerToast) triggerToast("Nama Program Studi dan Fakultas wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!editingId;
      const url = "/api/admin/study-programs";
      const method = isEdit ? "PATCH" : "POST";
      const payload = isEdit ? { id: editingId, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        if (triggerToast) triggerToast(isEdit ? "Program Studi berhasil diperbarui!" : "Program Studi baru berhasil ditambahkan!");
        setShowModal(false);
        fetchProdis();
      } else {
        if (triggerToast) triggerToast("Gagal menyimpan: " + data.error);
      }
    } catch (err: any) {
      if (triggerToast) triggerToast("Galat: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Program Studi ${name}?`)) return;

    try {
      const res = await fetch(`/api/admin/study-programs?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        if (triggerToast) triggerToast(`Program Studi ${name} berhasil dihapus.`);
        fetchProdis();
      } else {
        if (triggerToast) triggerToast("Gagal menghapus: " + data.error);
      }
    } catch (err: any) {
      if (triggerToast) triggerToast("Galat: " + err.message);
    }
  };

  return (
    <div className="space-y-6 fade-in pb-10">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              Manajemen Program Studi (Prodi) SIAKAD
            </h2>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
              Master Data Referensi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola daftar Program Studi, Kode Prodi, Jenjang Pendidikan, & Fakultas untuk seluruh sistem ERP UNSIA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProdis}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer flex items-center gap-1"
          >
            <span>🔄</span> Refresh
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span> Tambah Program Studi
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between bg-slate-50 items-center">
          <h3 className="font-bold text-slate-800">Daftar Program Studi</h3>
          <span className="font-mono font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full text-[11px]">
            {prodis.length} Program Studi
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 font-medium">Memuat data Program Studi...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-medium">Gagal memuat data: {error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Program Studi</th>
                  <th className="px-4 py-3">Fakultas</th>
                  <th className="px-4 py-3 text-center">Jenjang</th>
                  <th className="px-4 py-3 text-right">Aksi Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prodis.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Belum ada Program Studi yang terdaftar. Klik <strong>+ Tambah Program Studi</strong> untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  prodis.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">
                        {p.code || p.name.substring(0, 4).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{p.faculty}</td>
                      <td className="px-4 py-3 text-center font-bold">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-mono">
                          {p.degreeLevel || "S1"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 cursor-pointer"
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? "Edit Program Studi" : "Tambah Program Studi Baru"}
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
                <label className="block mb-1">Nama Program Studi</label>
                <input
                  type="text"
                  required
                  placeholder="S1 Informatika"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Kode Prodi</label>
                  <input
                    type="text"
                    placeholder="IF / 55201"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block mb-1">Jenjang Pendidikan</label>
                  <select
                    value={formData.degreeLevel}
                    onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="D3">D3 - Diploma 3</option>
                    <option value="S1">S1 - Sarjana</option>
                    <option value="S2">S2 - Magister</option>
                    <option value="S3">S3 - Doktor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Fakultas / Unit Pengampu</label>
                <input
                  type="text"
                  required
                  placeholder="Fakultas Teknologi Informasi (FTI)"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                />
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
                  {isSubmitting ? "Menyimpan..." : "Simpan Program Studi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
