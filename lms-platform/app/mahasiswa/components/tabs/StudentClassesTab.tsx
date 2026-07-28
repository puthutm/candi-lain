"use client";

export interface LMSClass {
  id: string;
  courseCode: string;
  courseName: string;
  sks: number;
  academicPeriodLabel: string;
  scheduleText: string;
}

interface StudentClassesTabProps {
  classes: LMSClass[];
  selectedClass: LMSClass | null;
  handleSelectClass: (cls: LMSClass) => void;
}

export default function StudentClassesTab({
  classes,
  selectedClass,
  handleSelectClass,
}: StudentClassesTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Daftar Kelas Perkuliahan Terdaftar (KRS)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih kelas untuk melihat modul sesi 1-16 & tautan vicon live.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {classes.map((cls) => (
          <div
            key={cls.id}
            onClick={() => handleSelectClass(cls)}
            className={`p-5 rounded-2xl border transition cursor-pointer ${
              selectedClass?.id === cls.id
                ? "border-[#0f487b] bg-blue-50/50 shadow-sm"
                : "border-slate-200 bg-white hover:border-blue-300"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono font-bold text-[#0f487b]">{cls.courseCode}</span>
              <span className="px-2.5 py-0.5 bg-blue-100 text-[#0f487b] font-bold rounded-full text-[10px]">
                {cls.sks} SKS
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">{cls.courseName}</h3>
            <p className="text-xs text-slate-500 font-medium">{cls.scheduleText}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
