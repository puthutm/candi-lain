"use client";

export interface KrsCourse {
  classId: string;
  className: string;
  courseCode: string;
  courseName: string;
  sks: number;
  courseType: string;
  capacity?: number;
  enrolledCount?: number;
  itemStatus?: string;
}

interface KrsTabProps {
  availableClasses: KrsCourse[];
  selectedKrs: string[];
  setSelectedKrs: (selected: string[]) => void;
  handleSubmitKrs: () => void;
  krsCourses: KrsCourse[];
  krsStatus: string | null;
  triggerToast: (msg: string) => void;
}

export default function KrsTab({
  availableClasses,
  selectedKrs,
  setSelectedKrs,
  handleSubmitKrs,
  krsCourses,
  krsStatus,
  triggerToast,
}: KrsTabProps) {
  const isKrsSubmitted = krsStatus === "submitted" || krsStatus === "approved";

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Pengisian & Pengajuan KRS Mahasiswa ({krsCourses.length} Approved MK)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih kelas mata kuliah berjalan dan ajukan persetujuan ke Dosen Pembimbing Akademik.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => triggerToast("Memperbarui daftar kelas KRS tersedia...")}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
          >
            🔄 Refresh Kelas
          </button>
          {isKrsSubmitted && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
              ✓ KRS Status: {krsStatus === "approved" ? "Disetujui Dosen PA" : "Menunggu Approving PA"}
            </span>
          )}
        </div>
      </div>

      {/* Available Classes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Daftar Kelas Perkuliahan Tersedia</h3>
          <button
            onClick={handleSubmitKrs}
            disabled={isKrsSubmitted || selectedKrs.length === 0}
            className="px-4 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
          >
            🚀 Ajukan KRS ({selectedKrs.length} MK)
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
              <tr>
                <th className="px-4 py-3 text-center">Pilih</th>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Mata Kuliah</th>
                <th className="px-4 py-3 text-center">SKS</th>
                <th className="px-4 py-3 text-center">Kelas</th>
                <th className="px-4 py-3 text-center">Kuota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {availableClasses.map((cls) => {
                const isChecked = selectedKrs.includes(cls.classId);
                return (
                  <tr key={cls.classId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        disabled={isKrsSubmitted}
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedKrs([...selectedKrs, cls.classId]);
                          } else {
                            setSelectedKrs(selectedKrs.filter((id) => id !== cls.classId));
                          }
                        }}
                        className="w-4 h-4 text-[#0f487b] rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{cls.courseCode}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{cls.courseName}</td>
                    <td className="px-4 py-3 text-center font-bold">{cls.sks}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{cls.className}</td>
                    <td className="px-4 py-3 text-center font-mono">{cls.enrolledCount || 30} / {cls.capacity || 35}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
