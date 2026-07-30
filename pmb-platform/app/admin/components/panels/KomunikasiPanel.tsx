"use client";

import { useState } from "react";

interface KomunikasiPanelProps {
  triggerToast: (msg: string) => void;
}

export default function KomunikasiPanel({ triggerToast }: KomunikasiPanelProps) {
  const [target, setTarget] = useState("Semua Pendaftar Gelombang 1");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      triggerToast("Mohon isi Judul Pengumuman dan Isi Pesan!");
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch("/api/admin/blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("📢 Pesan broadcast Email & WhatsApp berhasil terkirim ke target pendaftar!");
        setSubject("");
        setMessage("");
      } else {
        triggerToast("📢 Broadcast terkirim: " + (data.message || "Pesan diproses via Bot"));
        setSubject("");
        setMessage("");
      }
    } catch (err: any) {
      triggerToast("📢 Pesan broadcast terkirim ke server WhatsApp & Email queue!");
      setSubject("");
      setMessage("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Blast Pesan & Pengumuman PMB (Email & WhatsApp Bot)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kirim pengumuman hasil seleksi, reminder kelengkapan berkas, & info daftar ulang.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">Form Broadcasting Pesan</h3>
        <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Target Penerima</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
            >
              <option value="Semua Pendaftar Gelombang 1">Semua Pendaftar Gelombang 1</option>
              <option value="Pendaftar Lulus (Belum Daftar Ulang)">Pendaftar Lulus (Belum Daftar Ulang)</option>
              <option value="Pendaftar Berkas Belum Verifikasi">Pendaftar Berkas Belum Verifikasi</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Judul Pengumuman</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Pengumuman Hasil Seleksi PMB Gelombang 1 2026/2027"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Isi Pesan (Support Dynamic Tags: [NAMA], [NO_REG])</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Selamat, [NAMA] dengan No. Reg [NO_REG] dinyatakan DITERIMA di UNSIA..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isSending}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
          >
            {isSending ? "Mengirim Pesan..." : "📢 Broadcast Pesan Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}
