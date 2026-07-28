"use client";

export interface ClassData {
  classId: string;
  className: string;
  courseCode: string;
  courseName: string;
  sks: number;
  capacity: number;
  enrolledCount: number;
  mode: string;
}

export interface StudentGrade {
  gradeId: string | null;
  studentId: string;
  nim: string | null;
  fullName: string;
  tugasScore: string;
  utsScore: string;
  uasScore: string;
  finalScore: string;
  letterGrade: string | null;
  locked: boolean;
}

interface NilaiTabProps {
  classes: ClassData[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  grades: StudentGrade[];
  handleGradeChange: (index: number, field: "tugasScore" | "utsScore" | "uasScore", val: string) => void;
  handleSaveGrades: () => void;
  handleLockGrades: () => void;
}

export default function NilaiTab({
  classes,
  selectedClassId,
  setSelectedClassId,
  grades,
  handleGradeChange,
  handleSaveGrades,
  handleLockGrades,
}: NilaiTabProps) {
  const isLocked = grades.length > 0 && grades.every((g) => g.locked);

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Form Input Nilai Evaluasi Perkuliahan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Input nilai Tugas (20%), UTS (30%), & UAS (40%) mahasiswa per kelas diampu.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 text-xs">
        <label className="font-bold text-slate-700">Pilih Kelas Diampu:</label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[#0f487b]"
        >
          <option value="">-- Pilih Kelas Kuliah --</option>
          {classes.map((cls) => (
            <option key={cls.classId} value={cls.classId}>
              {cls.courseCode} · {cls.courseName} ({cls.className})
            </option>
          ))}
        </select>
      </div>

      {selectedClassId && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Roster Input Nilai Mahasiswa</h3>
            <div className="flex gap-2">
              <button
                onClick={handleSaveGrades}
                disabled={isLocked}
                className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-[#00719f] text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                💾 Simpan Draft Nilai
              </button>
              <button
                onClick={handleLockGrades}
                disabled={isLocked}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                🔒 Publikasi & Kunci KHS
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="px-4 py-3">NIM</th>
                  <th className="px-4 py-3">Nama Mahasiswa</th>
                  <th className="px-4 py-3 text-center">Tugas (20%)</th>
                  <th className="px-4 py-3 text-center">UTS (30%)</th>
                  <th className="px-4 py-3 text-center">UAS (40%)</th>
                  <th className="px-4 py-3 text-center">Nilai Akhir</th>
                  <th className="px-4 py-3 text-center">Huruf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grades.map((row, idx) => (
                  <tr key={row.studentId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{row.nim || "-"}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{row.fullName}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={row.tugasScore}
                        onChange={(e) => handleGradeChange(idx, "tugasScore", e.target.value)}
                        className="w-16 p-1 text-center border border-slate-200 rounded font-mono font-bold"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={row.utsScore}
                        onChange={(e) => handleGradeChange(idx, "utsScore", e.target.value)}
                        className="w-16 p-1 text-center border border-slate-200 rounded font-mono font-bold"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={row.uasScore}
                        onChange={(e) => handleGradeChange(idx, "uasScore", e.target.value)}
                        className="w-16 p-1 text-center border border-slate-200 rounded font-mono font-bold"
                      />
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                      {row.finalScore}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[11px]">
                        {row.letterGrade || "A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
