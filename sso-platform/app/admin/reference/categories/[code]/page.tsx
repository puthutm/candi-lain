import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ReferenceDataService } from "@/lib/services/reference";
import { redirect } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function CategoryItemsPage({ params }: PageProps) {
  const { code } = await params;
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    redirect("/");
  }

  const category = await ReferenceDataService.getCategoryByCode(code);
  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400">Category Not Found</h2>
          <p className="mt-2 text-slate-400 text-sm">The category code "{code}" does not exist.</p>
        </div>
      </div>
    );
  }

  // Load tree hierarchy items
  const tree = await ReferenceDataService.getItemHierarchy(code);

  // Recursive tree renderer with indentation
  const renderTreeNodes = (nodes: any[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="space-y-1">
        <div className="flex items-center gap-4 py-2 hover:bg-white/[0.01] transition-colors rounded px-2">
          {/* Depth Indentation */}
          <div className="flex shrink-0" style={{ width: `${depth * 24}px` }}>
            {depth > 0 && <span className="text-slate-600 border-l border-b border-dashed border-white/20 w-4 h-4 -mt-2 mr-2" />}
          </div>
          
          <div className="flex-1 flex justify-between items-center text-sm">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-500 font-medium">[{node.code}]</span>
              <span className="font-semibold text-white">{node.name}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {node.extraValue && (
                <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-400 border border-white/5 truncate max-w-xs">
                  JSON Extra: {JSON.stringify(node.extraValue)}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  node.isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {node.isActive ? "active" : "inactive"}
              </span>
            </div>
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="space-y-1">
            {renderTreeNodes(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            SSO Admin
          </div>
          <nav className="flex flex-col gap-2">
            <Link
              href="/admin/reference"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              &larr; Categories
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full">
        <header className="pb-6 border-b border-white/10">
          <span className="rounded bg-indigo-500/15 px-2.5 py-0.5 text-xs font-bold text-indigo-400 font-mono">
            {category.code}
          </span>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{category.name} Items Hierarchy</h1>
          <p className="text-slate-400 text-sm mt-1">{category.description || "No description provided."}</p>
        </header>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
          {tree.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No items registered in this category.</p>
          ) : (
            <div className="space-y-2">
              {renderTreeNodes(tree)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
