"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import Link from "next/link";

interface Client {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  redirectUris: string[];
  allowedGrantTypes: string[];
  status: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  
  // UI state for viewing URIs
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clients");
      const data = await res.json();
      if (data.success) {
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => {
    return (
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.clientId.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans">
      <AdminSidebar activeTab="clients" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                OAuth2 Clients
              </h1>
              <p className="mt-2 text-slate-400 text-sm">
                Lihat dan monitor kredensial client OAuth2 serta konfigurasi redirection untuk setiap integrasi aplikasi.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
            <input
              type="text"
              placeholder="Cari berdasarkan nama aplikasi atau Client ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/10 bg-white/[0.02] gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400 font-medium">Memuat client OAuth2...</span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <div className="text-4xl mb-4">🔑</div>
              <h3 className="font-semibold text-lg text-white">Tidak Ada Client</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                Belum ada integrasi aplikasi atau tidak ada client yang sesuai dengan kata kunci pencarian.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Nama Aplikasi</th>
                      <th className="p-4">Client ID</th>
                      <th className="p-4">Grant Types</th>
                      <th className="p-4">Redirection Callback</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredClients.map(client => (
                      <tr key={client.id} className="hover:bg-white/[0.01] transition-colors align-top">
                        <td className="p-4">
                          <span className="font-semibold text-white">{client.name}</span>
                          {client.description && (
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{client.description}</p>
                          )}
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-400">{client.clientId}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {client.allowedGrantTypes.map(gt => (
                              <span key={gt} className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-400 border border-white/5">
                                {gt}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">
                          <button
                            onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                          >
                            {client.redirectUris.length} whitelisted URIs
                          </button>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                            client.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/admin/applications/${client.id}`}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                          >
                            Kelola &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Callback URIs Details Drawer */}
              {expandedClientId && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-lg animate-fadeIn space-y-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-indigo-400">
                      Redirect URIs untuk: {" "}
                      <span className="text-white">
                        {clients.find(c => c.id === expandedClientId)?.name}
                      </span>
                    </span>
                    <button
                      onClick={() => setExpandedClientId(null)}
                      className="text-[10px] text-slate-500 hover:text-white"
                    >
                      ✕ Tutup
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {clients.find(c => c.id === expandedClientId)?.redirectUris.map(uri => (
                      <li key={uri} className="font-mono text-[10px] text-slate-300 bg-slate-950 p-2 rounded-lg border border-white/5 truncate">
                        {uri}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
