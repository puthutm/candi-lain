"use client";

export interface LMSSession {
  id: string;
  sessionNumber: number;
  topic: string;
  description: string;
}

interface ViconTabProps {
  selectedSession: LMSSession | null;
  durationMinutes: number;
  setDurationMinutes: (d: number) => void;
  viconStatus: string;
  handleCreateVicon: () => void;
}

export default function ViconTab({
  selectedSession,
  durationMinutes,
  setDurationMinutes,
  viconStatus,
  handleCreateVicon,
}: ViconTabProps) {
  if (!selectedSession) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs font-bold">
        💡 Pilih sesi pertemuan terlebih dahulu di tab "Sesi Pertemuan".
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Virtual Meeting Vicon (Sesi {selectedSession.sessionNumber}: {selectedSession.topic})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aktifkan ruang tatap muka virtual Zoom/Jitsi untuk sesi perkuliahan synchronously.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          📹 Setting Ruang Video Conference
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block mb-1">Durasi Meeting (Menit)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 90)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
            />
          </div>
          <button
            onClick={handleCreateVicon}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
          >
            🚀 Launch Vicon Meeting Sekarang
          </button>

          {viconStatus && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl">
              ✓ {viconStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
