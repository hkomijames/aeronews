import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db'; 
import { togglePublishStatus, deleteArticle } from './article-actions';
import HQPortalTabsContainer from './components/HQPortalTabsContainer';

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
    "use server"; 
    const cookieStore = await cookies();
    cookieStore.delete('auth_session');
    redirect('/hq-portal/login');
  }

  // Pass server data down cleanly into the client shell wrapper
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

      {/* Main Tab Controller Layer holding our section components */}
      <HQPortalTabsContainer 
        userRole={userRole} 
        articles={articles}
        togglePublishStatus={togglePublishStatus}
        deleteArticle={deleteArticle}
      />
    </div>
  );
}
