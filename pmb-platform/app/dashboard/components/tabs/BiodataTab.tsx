"use client";

interface BiodataTabProps {
  nik: string;
  setNik: (n: string) => void;
  birthPlace: string;
  setBirthPlace: (bp: string) => void;
  birthDate: string;
  setBirthDate: (bd: string) => void;
  gender: string;
  setGender: (g: string) => void;
  isProfileSubmitted: boolean;
  submittingProfile: boolean;
  handleProfileSubmit: (e: React.FormEvent) => void;
  triggerToast: (msg: string) => void;
}

export default function BiodataTab({
  nik,
  setNik,
  birthPlace,
  setBirthPlace,
  birthDate,
  setBirthDate,
  gender,
  setGender,
  isProfileSubmitted,
  submittingProfile,
  handleProfileSubmit,
  triggerToast,
}: BiodataTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Form Biodata Lengkap & Unggah Berkas Persyaratan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lengkapi data NIK, Tempat/Tgl Lahir, Ijazah/SKL, & Pasfoto 4x6.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => triggerToast("Memperbarui data biodata calon mahasiswa...")}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
          >
            🔄 Refresh
          </button>
          {isProfileSubmitted && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
              ✓ Biodata Terverifikasi
            </span>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          Data Identitas Calon Mahasiswa (Sesuai KTP)
        </h3>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-700">Nomor NIK (KTP/KK)</label>
              <input
                type="text"
                required
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-[#0f487b]"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-700">Jenis Kelamin</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-700">Tempat Lahir</label>
              <input
                type="text"
                required
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-700">Tanggal Lahir</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingProfile}
            className="px-5 py-2.5 bg-[#0f487b] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
          >
            {submittingProfile ? "Simpan Biodata..." : "Simpan & Lanjutkan Berkas"}
          </button>
        </form>
      </div>
    </div>
  );
}
