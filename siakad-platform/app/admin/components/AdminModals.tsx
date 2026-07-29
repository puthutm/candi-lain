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
        return "Tambah Tahun Ajaran";
      case "tambah_periode":
        return "Tambah Periode Akademik";
      case "tambah_kurikulum":
        return "Tambah Kurikulum Prodi";
      case "tambah_mk":
        return "Tambah Katalog Mata Kuliah";
      case "tambah_kelas":
        return "Tambah Kelas Paralel";
      case "tambah_jadwal":
        return "Tambah Sesi Jadwal";
      case "tambah_mhs":
        return "Tambah Mahasiswa Baru";
      case "tambah_dosen":
        return "Tambah Penugasan Dosen";
      case "tambah_surat":
        return "Tambah Pengajuan Surat";
      default:
        return "Tambah Parameter Akademik";
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
        triggerToast(`✓ Data ${activeModal?.replace("_", " ")} berhasil disimpan!`);
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
    <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4 fade-in overflow-y-auto">
      <div className={`bg-white rounded-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 ${activeModal === "tambah_periode" ? "max-w-3xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-lg">{getTitle()}</h3>
          <button
            onClick={() => setActiveModal(null)}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 text-base rounded-lg cursor-pointer"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs font-sans">
              {/* Kolom Kiri */}
              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Kode Periode</label>
                  <input
                    type="text"
                    required
                    placeholder="Kode Periode"
                    value={modalForm.kodePeriode || ""}
                    onChange={(e) => setModalForm({ ...modalForm, kodePeriode: e.target.value })}
                    className="w-full p-3 bg-[#f0f4f8] border border-slate-200 rounded-lg outline-none text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#0a4878]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Tahun Ajaran</label>
                  <select
                    required
                    value={modalForm.ta || ""}
                    onChange={(e) => setModalForm({ ...modalForm, ta: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-slate-700 font-medium cursor-pointer focus:border-[#0a4878]"
                  >
                    <option value="">Pilih Tahun Ajaran</option>
                    <option value="2026/2027">2026/2027</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2024/2025">2024/2025</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Semester</label>
                  <select
                    required
                    value={modalForm.semester || ""}
                    onChange={(e) => setModalForm({ ...modalForm, semester: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-slate-700 font-medium cursor-pointer focus:border-[#0a4878]"
                  >
                    <option value="">Pilih Semester</option>
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                    <option value="Antara">Antara</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Nama Periode</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Periode"
                    value={modalForm.periode || ""}
                    onChange={(e) => setModalForm({ ...modalForm, periode: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-slate-700 font-medium placeholder:text-slate-400 focus:border-[#0a4878]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Nama Singkat Periode</label>
                  <input
                    type="text"
                    placeholder="Nama Singkat Periode"
                    value={modalForm.shortName || ""}
                    onChange={(e) => setModalForm({ ...modalForm, shortName: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-slate-700 font-medium placeholder:text-slate-400 focus:border-[#0a4878]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Jumlah Pertemuan</label>
                  <select
                    value={modalForm.sessionCount || "16"}
                    onChange={(e) => setModalForm({ ...modalForm, sessionCount: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-slate-700 font-medium cursor-pointer focus:border-[#0a4878]"
                  >
                    <option value="">Pilih Jumlah Pertemuan</option>
                    <option value="16">16 Pertemuan Wajib</option>
                    <option value="14">14 Pertemuan</option>
                    <option value="8">8 Pertemuan</option>
                  </select>
                </div>
              </div>

              {/* Kolom Kanan */}
              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Tanggal Mulai Kuliah</label>
                  <input
                    type="date"
                    required
                    value={modalForm.startDate || ""}
                    onChange={(e) => setModalForm({ ...modalForm, startDate: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-slate-700 font-medium focus:border-[#0a4878]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Tanggal Akhir Kuliah</label>
                  <input
                    type="date"
                    required
                    value={modalForm.endDate || ""}
                    onChange={(e) => setModalForm({ ...modalForm, endDate: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-slate-700 font-medium focus:border-[#0a4878]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Tanggal Mulai UTS</label>
                  <input
                    type="date"
                    value={modalForm.utsStartDate || ""}
                    onChange={(e) => setModalForm({ ...modalForm, utsStartDate: e.target.value })}
                    className="w-full p-3 bg-[#f0f4f8] border border-slate-200 rounded-lg outline-none text-slate-700 font-medium focus:border-[#0a4878]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Tanggal Selesai UTS</label>
                  <input
                    type="date"
                    value={modalForm.utsEndDate || ""}
                    onChange={(e) => setModalForm({ ...modalForm, utsEndDate: e.target.value })}
                    className="w-full p-3 bg-[#f0f4f8] border border-slate-200 rounded-lg outline-none text-slate-700 font-medium focus:border-[#0a4878]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Tanggal Mulai UAS</label>
                  <input
                    type="date"
                    value={modalForm.uasStartDate || ""}
                    onChange={(e) => setModalForm({ ...modalForm, uasStartDate: e.target.value })}
                    className="w-full p-3 bg-[#f0f4f8] border border-slate-200 rounded-lg outline-none text-slate-700 font-medium focus:border-[#0a4878]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">Tanggal Selesai UAS</label>
                  <input
                    type="date"
                    value={modalForm.uasEndDate || ""}
                    onChange={(e) => setModalForm({ ...modalForm, uasEndDate: e.target.value })}
                    className="w-full p-3 bg-[#f0f4f8] border border-slate-200 rounded-lg outline-none text-slate-700 font-medium focus:border-[#0a4878]"
                  />
                </div>
              </div>
            </div>
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

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-6 py-2.5 bg-[#f0f4f8] hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition duration-150 cursor-pointer text-xs"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0a4878] hover:bg-[#0f487b] text-white font-bold rounded-lg shadow-sm transition duration-150 cursor-pointer text-xs"
            >
              Tambah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
