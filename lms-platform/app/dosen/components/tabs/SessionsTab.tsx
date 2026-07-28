"use client";

import { LMSClass, LMSSession } from "../page";

interface SessionsTabProps {
  selectedClass: LMSClass | null;
  sessions: LMSSession[];
  selectedSession: LMSSession | null;
  handleSelectSession: (sess: LMSSession) => void;
  showMsg: (text: string, type: "success" | "error") => void;
}

export default function SessionsTab({
  selectedClass,
  sessions,
  selectedSession,
  handleSelectSession,
  showMsg,
}: SessionsTabProps) {
  if (!selectedClass) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs font-bold">
        💡 Pilih kelas terlebih dahulu di tab "Kelas Diampu".
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Sesi Pertemuan 1 - 16 ({selectedClass.courseName})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih sesi untuk mengunggah modul kuliah atau mengaktifkan vicon meeting.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {sessions.map((sess) => (
          <button
            key={sess.id}
            onClick={() => handleSelectSession(sess)}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              selectedSession?.id === sess.id
                ? "border-indigo-600 bg-indigo-50 font-bold"
                : "border-slate-200 bg-white hover:border-indigo-300"
            }`}
          >
            <span className="text-[10px] text-indigo-700 uppercase font-mono block mb-1">
              Pertemuan {sess.sessionNumber}
            </span>
            <p className="text-slate-800 font-bold truncate">{sess.topic}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
