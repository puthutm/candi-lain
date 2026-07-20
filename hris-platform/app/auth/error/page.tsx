export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const reason = typeof searchParams.reason === "string" ? searchParams.reason : undefined;
  const message =
    reason === "credentials"
      ? "Kombinasi kredensial tidak valid."
      : reason === "access_denied"
        ? "Akses ditolak oleh Identity Provider."
        : reason === "configuration"
          ? "Terjadi kesalahan konfigurasi autentikasi."
          : "Terjadi kesalahan saat proses autentikasi.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans px-6">
      <div className="max-w-md w-full rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Autentikasi Gagal</h1>
        <p className="text-slate-300 mb-6">{message}</p>
        <a
          href="/auth/login"
          className="inline-flex rounded-lg bg-[#0B4A75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B4A75]/90"
        >
          Coba lagi
        </a>
      </div>
    </div>
  );
}
