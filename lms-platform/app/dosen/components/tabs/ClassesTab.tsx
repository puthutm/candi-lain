"use client";

import { LMSClass } from "../page";

interface ClassesTabProps {
  classes: LMSClass[];
  selectedClass: LMSClass | null;
  handleSelectClass: (cls: LMSClass) => void;
}

export default function ClassesTab({
  classes,
  selectedClass,
  handleSelectClass,
}: ClassesTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Daftar Kelas Perkuliahan Diampu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih kelas untuk mengelola materi, sesi 1-16, & ruang vicon.
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
                ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                : "border-slate-200 bg-white hover:border-indigo-300"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono font-bold text-indigo-700">{cls.courseCode}</span>
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded-full text-[10px]">
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
