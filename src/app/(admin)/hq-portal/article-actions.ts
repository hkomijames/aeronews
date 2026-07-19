"use server";

import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';

interface CreateArticleInput {
  title: string;
  excerpt: string;
  content: string; // The rich HTML output from TipTap
  imageUrl: string;
  category: string;
  isPublished: boolean;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export async function createArticle(data: CreateArticleInput) {
  try {
    // 1. Authenticate and extract author information from session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');
    
    if (!sessionCookie) {
      return { success: false, error: "Unauthorized operation. Session missing." };
    }
    
    const session = JSON.parse(sessionCookie.value);
    const authorId = session.id;

    // 2. Form guard validation
    if (!data.title || !data.content) {
      return { success: false, error: "Headline and Article Body are required." };
    }

    // 3. Generate a collision-resistant unique slug
    let slug = slugify(data.title);
    const existingArticle = await prisma.article.findUnique({ where: { slug } });
    if (existingArticle) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // 4. Save to PostgreSQL matching schema definitions
    const newArticle = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt || null,
        content: data.content,
        imageUrl: data.imageUrl || null,
        category: data.category || "General",
        isPublished: data.isPublished,
        authorId: authorId,
      },
    });

    // 5. CRITICAL FIX: Precise On-Demand Caching & Feed Evacuation Strategy
    if (newArticle.isPublished) {
      revalidatePath('/');
      revalidatePath(`/news/${newArticle.slug}`);
      
      const cleanCategorySlug = newArticle.category.toLowerCase().replace(/\s+/g, '-');
      revalidatePath(`/category/${cleanCategorySlug}`);

      // ─── FIXED FOR NEXT.JS 16: Added 'max' as the required second profile argument ───
      revalidateTag(`category-${cleanCategorySlug}`, 'max');
    }

    return { success: true, slug: newArticle.slug };

  } catch (error: any) {
    console.error("Failed to create article:", error);
    return { success: false, error: error.message || "Database execution failed." };
  }
}
// ─── AUDIT ACTION TO TOGGLE PUBLISH BOOLEAN STATUS ───
export async function togglePublishStatus(id: string, currentStatus: boolean) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('auth_session')) {
      return { success: false, error: 'Unauthorized operation.' };
    }

    const updated = await prisma.article.update({
      where: { id },
      data: { isPublished: !currentStatus }
    });

    revalidatePath('/');
    revalidatePath(`/news/${updated.slug}`);
    
    const cleanCategorySlug = updated.category.toLowerCase().replace(/\s+/g, '-');
    revalidatePath(`/category/${cleanCategorySlug}`);
    revalidatePath('/hq-portal');

    // ─── FIXED FOR NEXT.JS 16: Added required 'max' profile parameter ───
    revalidateTag(`category-${cleanCategorySlug}`, 'max');
    
    return { success: true, isPublished: updated.isPublished };
  } catch (error) {
    console.error("Failed to toggle publish status:", error);
    return { success: false, error: 'Database update operation failed.' };
  }
}

// ─── AUDIT ACTION TO DELETE AN ARTICLE ENTIRELY ───
export async function deleteArticle(id: string) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('auth_session')) {
      return { success: false, error: 'Unauthorized operation.' };
    }

    const targets = await prisma.article.findUnique({
      where: { id },
      select: { slug: true, category: true }
    });

    await prisma.article.delete({
      where: { id }
    });

    if (targets) {
      revalidatePath('/');
      revalidatePath(`/news/${targets.slug}`);
      const cleanCategorySlug = targets.category.toLowerCase().replace(/\s+/g, '-');
      revalidatePath(`/category/${cleanCategorySlug}`);

      // ─── FIXED FOR NEXT.JS 16: Added required 'max' profile parameter ───
      revalidateTag(`category-${cleanCategorySlug}`, 'max');
    }
    revalidatePath('/hq-portal');
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete article asset:", error);
    return { success: false, error: 'Database removal operation failed.' };
  }
}

// ─── AUDIT ACTION TO UPDATE AN ARTICLE ───
export async function updateArticle(id: string, data: { title: string; category: string; excerpt: string }) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('auth_session')) return { success: false, error: 'Unauthorized.' };

    if (!data.title.trim()) return { success: false, error: 'Headline title is required.' };

    const oldArticle = await prisma.article.findUnique({
      where: { id },
      select: { category: true, slug: true }
    });

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        excerpt: data.excerpt || null,
      }
    });

    revalidatePath('/');
    revalidatePath(`/news/${updated.slug}`);
    
    if (oldArticle) {
      const oldCatSlug = oldArticle.category.toLowerCase().replace(/\s+/g, '-');
      revalidatePath(`/category/${oldCatSlug}`);
      // ─── FIXED FOR NEXT.JS 16: Added required 'max' profile parameter ───
      revalidateTag(`category-${oldCatSlug}`, 'max');
    }
    const newCatSlug = updated.category.toLowerCase().replace(/\s+/g, '-');
    revalidatePath(`/category/${newCatSlug}`);
    // ─── FIXED FOR NEXT.JS 16: Added required 'max' profile parameter ───
    revalidateTag(`category-${newCatSlug}`, 'max');
    
    revalidatePath('/hq-portal');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Database update failed.' };
  }
}
