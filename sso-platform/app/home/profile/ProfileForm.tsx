"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  initialUser: {
    fullName: string;
    email: string;
    photoUrl?: string | null;
  };
}

export default function ProfileForm({ initialUser }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialUser.fullName);
  const [email, setEmail] = useState(initialUser.email);
  const [avatarColor, setAvatarColor] = useState("indigo"); // indigo, purple, blue, pink, rose, teal, amber
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  
  // Photo upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initialUser.photoUrl || "");
  const [photoLoading, setPhotoLoading] = useState(false);

  const getAvatarInitials = () => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarGradient = () => {
    const gradients: Record<string, string> = {
      indigo: "from-indigo-500 to-indigo-600",
      purple: "from-purple-500 to-purple-600",
      blue: "from-blue-500 to-blue-600",
      pink: "from-pink-500 to-pink-600",
      rose: "from-rose-500 to-rose-600",
      teal: "from-teal-500 to-teal-600",
      amber: "from-amber-500 to-amber-600",
    };
    return gradients[avatarColor] || gradients.indigo;
  };

  const avatarColors = ["indigo", "purple", "blue", "pink", "rose", "teal", "amber"];

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      triggerNotice("Hanya file gambar yang diizinkan", true);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      triggerNotice("Ukuran file tidak boleh melebihi 5MB", true);
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      triggerNotice("Pilih foto terlebih dahulu", true);
      return;
    }

    setPhotoLoading(true);
    setNotice("Mengunggah foto...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/profile/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message || "Foto berhasil diunggah!");
        setSelectedFile(null);
        router.refresh();
      } else {
        triggerNotice(data.error || "Gagal mengunggah foto", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      triggerNotice("Nama lengkap dan email wajib diisi", true);
      return;
    }

    setLoading(true);
    setNotice("Menyimpan profil...");
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, avatarColor }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message || "Profil berhasil diperbarui!");
        router.refresh();
      } else {
        triggerNotice(data.error || "Gagal memperbarui profil", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const triggerNotice = (msg: string, error = false) => {
    setNotice(msg);
    setIsError(error);
    setTimeout(() => {
      setNotice(null);
    }, 5000);
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerNotice("Semua field password wajib diisi", true);
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerNotice("Konfirmasi password baru tidak cocok", true);
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message || "Password berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        triggerNotice(data.error || "Gagal mengubah password", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notice */}
      {notice && (
        <div className={`fixed bottom-5 right-5 z-50 px-6 py-4 rounded-2xl border shadow-2xl transition-all duration-350 max-w-sm ${
          isError 
             ? "bg-rose-950/90 border-rose-800 text-rose-200" 
             : "bg-emerald-950/90 border-emerald-800 text-emerald-200"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{isError ? "⚠️" : "💡"}</span>
            <p className="text-xs font-bold tracking-wide">{notice}</p>
          </div>
        </div>
      )}

      {/* Avatar Editor Section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <h2 className="text-xl font-bold mb-6">Edit Avatar</h2>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-4">
            <div className={`flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient()} text-4xl font-bold text-white shadow-lg`}>
              {getAvatarInitials()}
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pratinjau Avatar</p>
              <p className="text-sm text-slate-300 mt-2">{getAvatarInitials()} - {fullName}</p>
            </div>
          </div>

          {/* Color Selector */}
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Pilih Warna Avatar
            </label>
            <div className="grid grid-cols-3 gap-3">
              {avatarColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    avatarColor === color
                      ? "border-white/50 bg-white/10"
                      : "border-white/10 bg-white/5 hover:bg-white/[0.08]"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-md bg-gradient-to-br ${
                      color === "indigo"
                        ? "from-indigo-500 to-indigo-600"
                        : color === "purple"
                        ? "from-purple-500 to-purple-600"
                        : color === "blue"
                        ? "from-blue-500 to-blue-600"
                        : color === "pink"
                        ? "from-pink-500 to-pink-600"
                        : color === "rose"
                        ? "from-rose-500 to-rose-600"
                        : color === "teal"
                        ? "from-teal-500 to-teal-600"
                        : "from-amber-500 to-amber-600"
                    }`}
                  />
                  <p className="mt-2 text-xs font-medium capitalize">{color}</p>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Avatar Anda akan otomatis menampilkan inisial nama depan dan belakang Anda dengan warna yang dipilih.
            </p>
          </div>
        </div>
      </div>

      {/* Photo Upload Section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <h2 className="text-xl font-bold mb-6">Foto Profil</h2>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Photo Preview */}
          <div className="flex flex-col items-center gap-4">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Photo preview"
                  className="h-40 w-40 rounded-full object-cover border-4 border-indigo-500/30 shadow-lg"
                />
                {selectedFile && (
                  <div className="absolute inset-0 rounded-full bg-indigo-500/20 border-4 border-indigo-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">Baru</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-40 w-40 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-dashed border-white/20 flex items-center justify-center">
                <span className="text-slate-400 text-4xl">📷</span>
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pratinjau Foto</p>
              <p className="text-sm text-slate-300 mt-2">
                {photoPreview ? "Foto siap diunggah" : "Belum ada foto"}
              </p>
            </div>
          </div>

          {/* Upload Form */}
          <div className="flex-1">
            <form onSubmit={handlePhotoUpload} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4"
                  htmlFor="photoInput"
                >
                  Pilih Foto
                </label>
                <input
                  id="photoInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-600 file:text-white
                    hover:file:bg-indigo-500
                    cursor-pointer"
                />
              </div>

              <p className="text-xs text-slate-400">
                Format: JPG, PNG, GIF, WebP (Maks: 5MB)
              </p>

              {selectedFile && (
                <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 p-3">
                  <p className="text-xs text-indigo-300">
                    📦 <strong>{selectedFile.name}</strong> - {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || photoLoading}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition w-full ${
                  !selectedFile || photoLoading
                    ? "bg-slate-800 border border-slate-700 cursor-not-allowed text-slate-500"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/25 cursor-pointer"
                }`}
              >
                {photoLoading ? "Mengunggah..." : "Unggah Foto"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="text-sm text-slate-400">Nama Saat Ini</div>
          <div className="mt-1 text-lg font-semibold">{initialUser.fullName}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="text-sm text-slate-400">Email Saat Ini</div>
          <div className="mt-1 text-lg font-semibold">{initialUser.email}</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <p className="mt-1 text-sm text-slate-400">Perbarui detail profil akun SSO Anda</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                htmlFor="fullName"
              >
                Nama Lengkap
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition ${
                  loading
                    ? "bg-slate-800 border border-slate-700 cursor-not-allowed text-slate-500"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/25 cursor-pointer"
                }`}
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-xl font-bold">Ganti Password</h2>
          <p className="mt-1 text-sm text-slate-400">Jaga keamanan akun Anda dengan memperbarui password secara berkala</p>

          <form onSubmit={handlePasswordChangeSubmit} className="mt-6 space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                htmlFor="currentPassword"
              >
                Password Lama
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                htmlFor="newPassword"
              >
                Password Baru
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                htmlFor="confirmPassword"
              >
                Konfirmasi Password Baru
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={passwordLoading}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition ${
                  passwordLoading
                    ? "bg-slate-800 border border-slate-700 cursor-not-allowed text-slate-500"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/25 cursor-pointer"
                }`}
              >
                {passwordLoading ? "Memproses..." : "Ganti Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
