"use client";

import { useState } from 'react';
import EditArticleModal from './EditArticleModal';
import EditProfileForm from './EditProfileForm'; // Adjust path based on your exact file tree

interface Author {
  id: string;
  name: string;
  email: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  isPublished: boolean;
  author: Author;
}

interface TabsContainerProps {
  userRole: string;
  articles: Article[];
  initialProfileData: any;
  // ─── OPTIMIZED: Changed from Promise<void> to Promise<any> to match your action payloads ───
  togglePublishStatus: (id: string, isPublished: boolean) => Promise<any>;
  deleteArticle: (id: string) => Promise<any>;
}

export default function HQPortalTabsContainer({
  userRole,
  articles,
  initialProfileData,
  togglePublishStatus,
  deleteArticle
}: TabsContainerProps) {
  // Available Tabs: 'desk' (Writer Desk), 'profile' (Edit Profile), 'admin' (Admin Panel if Admin)
  const [activeTab, setActiveTab] = useState<'desk' | 'profile' | 'admin'>('desk');

  return (
    <div className="space-y-6">
      {/* ─── TAB NAVIGATION BAR ─── */}
      <div className="flex border-b border-slate-800 gap-2 mb-6">
        <button
          onClick={() => setActiveTab('desk')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'desk'
              ? 'border-blue-500 text-white bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📝 Writer Desk & Inventory
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'profile'
              ? 'border-blue-500 text-white bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          👤 Edit My Journalist Profile
        </button>

        {userRole === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'admin'
                ? 'border-blue-500 text-white bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          >
            🛡️ Admin Console
          </button>
        )}
      </div>

      {/* ─── TAB PANELS TRANSITIONS ─── */}

      {/* 1. WRITER DESK & ARTICLES PANEL */}
      {activeTab === 'desk' && (
        <div className="space-y-6 animate-fadeIn">
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📝</span>
              <h2 className="text-lg font-bold text-white">Newsroom Writer Desk</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">Draft, edit, and format dynamic media entries for the public news feed.</p>
            
            <div className="flex flex-wrap gap-4">
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

          {/* EDITORIAL PUBLICATION AUDIT DASHBOARD */}
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
                            <EditArticleModal article={article} />
                            
                            <form action={async () => { await togglePublishStatus(article.id, article.isPublished); }}>
                              <button type="submit" className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded transition-colors text-[10px]">
                                {article.isPublished ? '⚠️ Unpublish' : '🚀 Go Live'}
                              </button>
                            </form>
                            
                            <form action={async () => { await deleteArticle(article.id); }}>
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
      )}

      {/* 2. PROFILE EDIT SUB-FORM PANEL */}
      {activeTab === 'profile' && (
        <div className="animate-fadeIn">
           <EditProfileForm initialData={initialProfileData} />
        </div>
      )}

      {/* 3. SYSTEM ADMINISTRATOR MANAGEMENT PANEL */}
      {activeTab === 'admin' && userRole === 'ADMIN' && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl animate-fadeIn">
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
    </div>
  );
}
