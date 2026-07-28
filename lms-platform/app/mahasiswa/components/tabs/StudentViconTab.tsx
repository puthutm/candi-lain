"use client";

export interface LMSSession {
  id: string;
  sessionNumber: number;
  topic: string;
  description: string;
}

export interface ViconDetails {
  id: string;
  sessionId: string;
  title: string;
  meetingLink: string;
  durationMinutes: number;
}

interface StudentViconTabProps {
  selectedSession: LMSSession | null;
  vicon: ViconDetails | null;
  isMeetingJoined: boolean;
  attendanceLog: any;
  handleJoinVicon: () => void;
}

export default function StudentViconTab({
  selectedSession,
  vicon,
  isMeetingJoined,
  attendanceLog,
  handleJoinVicon,
}: StudentViconTabProps) {
  if (!selectedSession) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs font-bold">
        💡 Pilih sesi pertemuan terlebih dahulu di tab "Sesi Kuliah".
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Vicon & Presensi Live (Sesi {selectedSession.sessionNumber}: {selectedSession.topic})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ikuti sesi tatap muka virtual live & konfirmasi presensi kehadiran otomatis.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          📹 Ruang Live Vicon Perkuliahan
        </h3>
        <div className="space-y-3">
          {vicon ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center font-bold text-slate-800">
                <span>{vicon.title}</span>
                <span className="text-blue-700 font-mono">Durasi: {vicon.durationMinutes} Menit</span>
              </div>
              <button
                onClick={handleJoinVicon}
                className={`w-full py-2.5 text-white font-bold rounded-xl shadow-md cursor-pointer transition ${
                  isMeetingJoined ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#0f487b] hover:bg-blue-700"
                }`}
              >
                {isMeetingJoined ? "✓ Re-Join Video Conference (Joined)" : "📹 Join Video Conference Now →"}
              </button>
            </div>
          ) : (
            <p className="text-slate-400 font-medium">
              Dosen belum mengaktifkan ruang vicon pada sesi ini.
            </p>
          )}

          {attendanceLog && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl">
              ✓ Kehadiran Anda berhasil dicatat secara otomatis pada jam {new Date(attendanceLog.joinedAt || Date.now()).toLocaleTimeString("id-ID")}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
