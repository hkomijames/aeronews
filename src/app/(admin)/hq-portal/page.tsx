import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db'; // Injected to read your PostgreSQL rows directly
import { togglePublishStatus, deleteArticle } from './article-actions'; // Connected to your audit controls
import EditArticleModal from './components/EditArticleModal';


export default async function HQPortalPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session');

  if (!sessionCookie) {
    redirect('/hq-portal/login');
  }

  const session = JSON.parse(sessionCookie.value);
  const userRole = session.role; 

  // Fetch all articles directly on the server to pass cleanly into the audit log view
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: true }
  });

  // Server Action function triggered inside our dashboard form layout element
  async function handleLogout() {
    "use server"; // Runs strictly on the server layer
    const cookieStore = await cookies();
    cookieStore.delete('auth_session');
    redirect('/hq-portal/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="mb-8 border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">AV Newsroom HQ Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Security clearance level: <span className="font-bold text-blue-400 uppercase">{userRole}</span>
          </p>
        </div>
        
        {/* Clean, zero-client server-driven signout button form */}
        <form action={handleLogout}>
          <button 
            type="submit"
            className="text-xs font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 px-4 py-2 rounded-lg transition-colors"
          >
            Log Out Securely
          </button>
        </form>
      </header>

      {userRole === 'ADMIN' && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🛡️</span>
            <h2 className="text-lg font-bold text-white">System Administrator Console</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Complete platform overrides and system architecture management enabled.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/60 hover:border-slate-700 transition-colors cursor-pointer">
              <span className="font-bold block text-sm text-slate-200">Register Staff Authors</span>
              <p className="text-xs text-slate-500 mt-1">Onboard news journalists and configure E-E-A-T background bios.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/60 hover:border-slate-700 transition-colors cursor-pointer">
              <span className="font-bold block text-sm text-slate-200">Global Editorial Audit</span>
              <p className="text-xs text-slate-500 mt-1">Override publication statuses or delete indexing article feeds.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/60 hover:border-slate-700 transition-colors cursor-pointer">
              <span className="font-bold block text-sm text-slate-200">Google News RSS Syndication</span>
              <p className="text-xs text-slate-500 mt-1">Review live metadata XML feeds and check structured data syntax tests.</p>
            </div>
          </div>
        </section>
      )}

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📝</span>
          <h2 className="text-lg font-bold text-white">Newsroom Writer Desk</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">Draft, edit, and format dynamic media entries for the public news feed.</p>
        
        <div className="flex flex-wrap gap-4">
          {/* FIXED: Removed the buggy nested HTML button layer to prevent validation mismatches */}
          <a 
            href="/hq-portal/new-article" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors"
          >
            + Draft New Breaking Article
          </a>
          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-2.5 rounded-lg border border-slate-700 transition-colors">
            View My News Submissions
          </button>
        </div>
      </section>

      {/* ─── ADDED: EDITORIAL PUBLICATION AUDIT DASHBOARD ─── */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4">Platform Publication Inventory</h2>
        
        {articles.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No news entries found inside the PostgreSQL database table.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-2">Headline Details</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Reporter</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-4 px-2 max-w-xs">
                      <span className="font-bold text-slate-200 block truncate">{article.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{article.slug}</span>
                    </td>
                    <td className="py-4 px-2 text-slate-300 font-medium">{article.category}</td>
                    <td className="py-4 px-2 text-slate-400">{article.author.name}</td>
                    <td className="py-4 px-2">
                      {article.isPublished ? (
                        <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">LIVE INDEXED</span>
                      ) : (
                        <span className="bg-amber-950/80 text-amber-400 border border-amber-900 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">DRAFT OVERHEAD</span>
                      )}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex gap-2 justify-end">
                        {/* ─── INJECTED: INTERACTIVE OVERRIDE MODAL ACTIONS BUTTON ─── */}
    <EditArticleModal article={article} />
                        {/* Server-Driven Publishing Switch Toggles */}
                        <form action={async () => { "use server"; await togglePublishStatus(article.id, article.isPublished); }}>
                          <button type="submit" className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded transition-colors text-[10px]">
                            {article.isPublished ? '⚠️ Unpublish' : '🚀 Go Live'}
                          </button>
                        </form>
                        
                        {/* Server-Driven Deletion Form Overrides */}
                        <form action={async () => { "use server"; await deleteArticle(article.id); }}>
                          <button type="submit" className="bg-red-950/40 hover:bg-red-900/60 border border-red-900 text-red-400 font-bold px-3 py-1.5 rounded transition-colors text-[10px]">
                            🗑️ Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
