import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db'; 
import { Prisma } from '@prisma/client'; // INJECTED FOR STRICT TYPINGS
import { togglePublishStatus, deleteArticle } from './article-actions';
import HQPortalTabsContainer from './components/HQPortalTabsContainer';

// Define a type blueprint that matches the exact relations fetched below
type ArticleWithAuthor = Prisma.ArticleGetPayload<{
  include: { author: true }
}>;

export default async function HQPortalPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session');

  if (!sessionCookie) {
    redirect('/hq-portal/login');
  }

  let session;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch (err) {
    redirect('/hq-portal/login');
  }

  const userRole = session.role; 
  const userId = session.id; // ─── OPTIMIZED: READS UNIQUE USER ID INSTEAD OF EMAIL FROM YOUR COOKIE METADATA ───

  // STRICTLY TYPED MATRICES PREVENT COMPILER ERRORS
  let articles: ArticleWithAuthor[] = [];
  let currentAuthorData: {
    name: string;
    title: string | null;
    bio: string | null;
    avatarUrl: string | null;
    sameAsLinks: string[];
  } | null = null;

  try {
    // SAFEGUARDED: Fetch operations wrapped together to prevent compiler data failures
    articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: true }
    });

    // ─── OPTIMIZED: LOOKS UP THE LOGGED-IN JOURNALIST BY UNIQUE USER ID ───
    if (userId) {
      currentAuthorData = await prisma.user.findUnique({
        where: { id: userId }, // TARGETS THE SPECIFIC DATABASE RECORD ID STRING
        select: {
          name: true,
          title: true,
          bio: true,
          avatarUrl: true,
          sameAsLinks: true,
          content: true,
        }
      });
    }
  } catch (error) {
    console.error("Graceful database isolation fallback tracker:", error);
    // Prevents breaking the layout if a database connection times out during a server sleep cycle
  }

  async function handleLogout() {
    "use server"; 
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
        initialProfileData={currentAuthorData} // PASSED: Initial server data prevents fetch 401 bugs!
        togglePublishStatus={togglePublishStatus}
        deleteArticle={deleteArticle}
      />
    </div>
  );
}
