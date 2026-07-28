"use client";

interface ApplicantModalsProps {
  showPasswordModal: boolean;
  newPassword: string;
  setNewPassword: (p: string) => void;
  confirmPassword: string;
  setConfirmPassword: (p: string) => void;
  changingPassword: boolean;
  handleChangePasswordSubmit: (e: React.FormEvent) => void;
}

export default function ApplicantModals({
  showPasswordModal,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  changingPassword,
  handleChangePasswordSubmit,
}: ApplicantModalsProps) {
  if (!showPasswordModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          🔒 Wajib Ubah Password Akun PMB Pertama Kali
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Demi keamanan akun Anda, buatlah kata sandi baru untuk mengakses Portal PMB.
        </p>

        <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs font-semibold">
          <div>
            <label className="block mb-1 text-slate-700">Password Baru</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0f487b]"
            />
          </div>
          <div>
            <label className="block mb-1 text-slate-700">Konfirmasi Password Baru</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0f487b]"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-2.5 bg-[#0f487b] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 mt-2"
          >
            {changingPassword ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}
