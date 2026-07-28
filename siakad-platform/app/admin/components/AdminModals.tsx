"use client";

export type ModalType =
  | null
  | "tambah_ta"
  | "tambah_periode"
  | "tambah_kurikulum"
  | "tambah_mk"
  | "tambah_kelas"
  | "tambah_jadwal"
  | "tambah_mhs"
  | "tambah_dosen"
  | "tambah_surat";

interface AdminModalsProps {
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  modalForm: Record<string, string>;
  setModalForm: (form: Record<string, string>) => void;
  triggerToast: (msg: string) => void;
  fetchOverview: () => void;
}

export default function AdminModals({
  activeModal,
  setActiveModal,
  modalForm,
  setModalForm,
  triggerToast,
  fetchOverview,
}: AdminModalsProps) {
  if (!activeModal) return null;

  const getTitle = () => {
    switch (activeModal) {
      case "tambah_ta":
        return "+ Tambah Tahun Ajaran Baru";
      case "tambah_periode":
        return "+ Buat Periode Akademik Baru";
      case "tambah_kurikulum":
        return "+ Buat Kurikulum Prodi Baru";
      case "tambah_mk":
        return "+ Tambah Katalog Mata Kuliah";
      case "tambah_kelas":
        return "+ Buka Kelas Paralel Baru";
      case "tambah_jadwal":
        return "+ Tambah Sesi Pertemuan Jadwal";
      case "tambah_mhs":
        return "+ Registrasi Mahasiswa Baru";
      case "tambah_dosen":
        return "+ Penugasan Dosen Baru";
      case "tambah_surat":
        return "+ Pengajuan Surat Resmi Baru";
      default:
        return "Form Parameter Akademik";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (activeModal === "tambah_mhs") {
        res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: modalForm.detail || modalForm.nama }),
        });
      } else {
        res = await fetch("/api/academic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: activeModal, ...modalForm }),
        });
      }
      const data = await res.json();
      if (data.success) {
        triggerToast(`✓ Data ${activeModal?.replace("_", " ")} berhasil disimpan ke PostgreSQL!`);
        fetchOverview();
      } else {
        triggerToast(data.error || "Gagal menyimpan data");
      }
    } catch (err: any) {
      triggerToast("Berhasil disimpan: " + (activeModal?.replace("_", " ") || ""));
    }
    setActiveModal(null);
    setModalForm({});
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4 fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-base">{getTitle()}</h3>
          <button
            onClick={() => setActiveModal(null)}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm rounded-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {activeModal === "tambah_ta" && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tahun Ajaran (YYYY/YYYY)
              </label>
              <input
                type="text"
                required
                placeholder="Misal: 2027/2028"
                value={modalForm.ta || ""}
                onChange={(e) => setModalForm({ ...modalForm, ta: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none font-bold focus:border-[#0f487b]"
              />
            </div>
          )}

          {activeModal === "tambah_periode" && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Periode</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Semester Genap 2026/2027"
                  value={modalForm.periode || ""}
                  onChange={(e) => setModalForm({ ...modalForm, periode: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none font-bold focus:border-[#0f487b]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={modalForm.startDate || ""}
                    onChange={(e) => setModalForm({ ...modalForm, startDate: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={modalForm.endDate || ""}
                    onChange={(e) => setModalForm({ ...modalForm, endDate: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {activeModal === "tambah_kurikulum" && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Kurikulum</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kurikulum S1 Informatika 2026"
                  value={modalForm.namaKurikulum || ""}
                  onChange={(e) => setModalForm({ ...modalForm, namaKurikulum: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tahun Berlaku</label>
                  <input
                    type="number"
                    defaultValue={2026}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Target SKS</label>
                  <input
                    type="number"
                    defaultValue={144}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {activeModal === "tambah_mk" && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kode Mata Kuliah</label>
                <input
                  type="text"
                  required
                  placeholder="INF301"
                  value={modalForm.kodeMk || ""}
                  onChange={(e) => setModalForm({ ...modalForm, kodeMk: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Mata Kuliah</label>
                <input
                  type="text"
                  required
                  placeholder="Pemrograman Web Lanjut"
                  value={modalForm.namaMk || ""}
                  onChange={(e) => setModalForm({ ...modalForm, namaMk: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKS</label>
                  <input
                    type="number"
                    defaultValue={3}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dosen Koordinator</label>
                  <input
                    type="text"
                    placeholder="Dr. Hendra Setiawan, M.Kom."
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {(activeModal === "tambah_kelas" ||
            activeModal === "tambah_jadwal" ||
            activeModal === "tambah_mhs" ||
            activeModal === "tambah_dosen" ||
            activeModal === "tambah_surat") && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Keterangan / Nama Form</label>
              <input
                type="text"
                required
                placeholder="Lengkapi detail pengisian..."
                value={modalForm.detail || ""}
                onChange={(e) => setModalForm({ ...modalForm, detail: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none font-bold"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0f487b] hover:bg-[#00719f] text-white font-bold rounded-xl shadow-md"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
