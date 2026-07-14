"use client";

import { useRole } from "../context/RoleContext";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Course {
  code: string;
  name: string;
}

interface Material {
  id: string;
  title: string;
  description: string | null;
  courseCode: string;
  topic: string;
  tags: string[] | null;
  materialType: string;
  verificationStatus: string;
  currentVersionNumber: number;
  versions?: {
    id: string;
    versionNumber: number;
    fileUrl: string;
    changelog: string | null;
    uploadedAt: string;
  }[];
  currentVersion?: {
    fileUrl: string;
  };
}

export default function MateriPage() {
  const { currentRole } = useRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [topic, setTopic] = useState("");
  const [materialType, setMaterialType] = useState("dokumen");
  const [fileUrl, setFileUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Revision Form State
  const [revisionItemId, setRevisionItemId] = useState<string | null>(null);
  const [revisionFileUrl, setRevisionFileUrl] = useState("");
  const [revisionChangelog, setRevisionChangelog] = useState("");

  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const triggerNotice = (msg: string, error = false) => {
    setNotice(msg);
    setIsError(error);
    setTimeout(() => setNotice(null), 5000);
  };

  const loadData = async () => {
    try {
      const courseRes = await fetch("/api/courses");
      const courseData = await courseRes.json();
      if (courseData.success) {
        setCourses(courseData.courses || []);
        if (courseData.courses?.length > 0) {
          setCourseCode(courseData.courses[0].code);
        }
      }

      // Fetch all materials
      const matRes = await fetch("/api/materi?status=all");
      const matData = await matRes.json();
      if (matData.success) {
        setMaterials(matData.materials || []);
      }
    } catch (e: any) {
      triggerNotice("Gagal memuat data: " + e.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !courseCode || !topic || !fileUrl) {
      triggerNotice("Semua field wajib diisi", true);
      return;
    }

    setSubmitting(true);
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/materi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          courseCode,
          topic,
          tags,
          materialType,
          fileUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotice("Bahan ajar berhasil diunggah & diajukan untuk verifikasi!");
        setShowAddForm(false);
        setTitle("");
        setDescription("");
        setTopic("");
        setFileUrl("");
        setTagsInput("");
        loadData();
      } else {
        triggerNotice(data.error || "Gagal mengunggah materi", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionFileUrl || !revisionItemId) {
      triggerNotice("File URL wajib diisi", true);
      return;
    }

    try {
      const res = await fetch(`/api/materi/${revisionItemId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: revisionFileUrl,
          changelog: revisionChangelog,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotice("Revisi versi baru berhasil diajukan untuk verifikasi ulang!");
        setRevisionItemId(null);
        setRevisionFileUrl("");
        setRevisionChangelog("");
        loadData();
      } else {
        triggerNotice(data.error || "Gagal merevisi versi", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Data Bank Materi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
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

      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-sm font-bold text-white transition">
            &larr;
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Bank Materi Akademik</h1>
            <p className="text-xs text-slate-400 font-medium">Unggah, versioning, dan cari bahan kuliah terintegrasi.</p>
          </div>
        </div>

        {currentRole === "dosen" && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
          >
            {showAddForm ? "Batal" : "+ Unggah Materi Baru"}
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        {/* Form add material */}
        {showAddForm && (
          <form onSubmit={handleAddMaterial} className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <h2 className="text-base font-bold text-white">Unggah Bahan Kuliah Baru</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Judul Materi</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  placeholder="e.g. Modul 1: OOP & Enkapsulasi"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Mata Kuliah</label>
                <select
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                >
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Topik / Bahasan</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  placeholder="e.g. Pemrograman Berorientasi Objek"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Tipe File</label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                >
                  <option value="dokumen">Dokumen (PDF/Word)</option>
                  <option value="video">Video Pembelajaran</option>
                  <option value="presentasi">Presentasi (PPT)</option>
                  <option value="dataset">Dataset / Sumber Praktikum</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">URL File Aset</label>
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  placeholder="e.g. https://storage.unsia.ac.id/materi/oop.pdf"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Tags (pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  placeholder="e.g. java, oop, dasar"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Deskripsi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  placeholder="Deskripsi singkat mengenai isi bahan ajar ini..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Mengunggah..." : "Ajukan Bahan Ajar"}
              </button>
            </div>
          </form>
        )}

        {/* Revision Form overlay */}
        {revisionItemId && (
          <form onSubmit={handleRevision} className="p-6 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-4">
            <h2 className="text-base font-bold text-white">Ajukan Versi Revisi Baru</h2>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">URL File Baru</label>
                <input
                  type="text"
                  value={revisionFileUrl}
                  onChange={(e) => setRevisionFileUrl(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  placeholder="e.g. https://storage.unsia.ac.id/materi/oop-revised.pdf"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Changelog / Deskripsi Perubahan</label>
                <input
                  type="text"
                  value={revisionChangelog}
                  onChange={(e) => setRevisionChangelog(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  placeholder="e.g. Memperbaiki salah ketik di slide 3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevisionItemId(null)}
                className="rounded bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
              >
                Kirim Revisi
              </button>
            </div>
          </form>
        )}

        {/* List of materials */}
        <section className="space-y-4">
          <h2 className="text-base font-bold">Daftar Bahan Ajar</h2>
          {materials.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Belum ada materi terdaftar. Klik + Unggah Materi Baru di atas untuk kontribusi.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {materials.map((mat) => (
                <div key={mat.id} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded bg-indigo-500/5">
                        {mat.courseCode}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase">
                        {mat.materialType}
                      </span>
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                        mat.verificationStatus === "terbit" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : mat.verificationStatus === "menunggu_bpm" || mat.verificationStatus === "menunggu_prodi"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {mat.verificationStatus.replace("_", " ")}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{mat.title}</h3>
                      <p className="text-xs text-slate-400 font-semibold">Topik: {mat.topic}</p>
                      {mat.description && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{mat.description}</p>}
                    </div>

                    {mat.tags && mat.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {mat.tags.map(t => (
                          <span key={t} className="text-[9px] font-semibold text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right flex flex-col justify-between items-end h-full min-h-[100px]">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">Versi Aktif</span>
                      <span className="text-lg font-black text-white">v{mat.currentVersionNumber}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      {mat.currentVersion?.fileUrl && (
                        <a 
                          href={mat.currentVersion.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-lg transition"
                        >
                          Unduh Berkas
                        </a>
                      )}
                      {currentRole === "dosen" && (
                        <button
                          onClick={() => {
                            setRevisionItemId(mat.id);
                            setRevisionFileUrl(mat.currentVersion?.fileUrl || "");
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          Ajukan Revisi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
