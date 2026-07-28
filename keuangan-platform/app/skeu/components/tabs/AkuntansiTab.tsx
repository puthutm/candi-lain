"use client";

export interface CoaAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
}

interface AkuntansiTabProps {
  coa: CoaAccount[];
  triggerNotice: (msg: string) => void;
}

export default function AkuntansiTab({ coa, triggerNotice }: AkuntansiTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Akuntansi & Chart of Accounts (COA)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar kode akun akuntansi neraca keuangan kampus.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
            <tr>
              <th className="px-4 py-3 font-mono">Kode Akun</th>
              <th className="px-4 py-3">Nama Akun (COA)</th>
              <th className="px-4 py-3 text-center">Tipe Akun</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coa.map((account) => (
              <tr key={account.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{account.accountCode}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{account.accountName}</td>
                <td className="px-4 py-3 text-center font-bold">{account.accountType}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => triggerNotice(`Detail akun ${account.accountCode}`)}
                    className="text-[#0f487b] font-bold hover:underline cursor-pointer"
                  >
                    Detail →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
