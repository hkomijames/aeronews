"use server";

import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateUserProfile(formData: {
  name: string;
  email: string; // ✨ Added required email field configuration constraint
  title: string;
  bio: string;
  avatarUrl: string;
  sameAsLinks: string[];
}) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');
    if (!sessionCookie) return { success: false, error: "Unauthorized session token" };

    const session = JSON.parse(sessionCookie.value);
    
    // ─── OPTIMIZED: READS UNIQUE ID DIRECTLY FROM YOUR COOKIE METADATA ───
    if (!session.id) return { success: false, error: "Invalid session metadata" };

    if (!formData.name || !formData.name.trim()) {
      return { success: false, error: "Display Name is required" };
    }

    // Basic email validation check line
    if (!formData.email || !formData.email.trim() || !formData.email.includes('@')) {
      return { success: false, error: "A valid corporate email address is required" };
    }

    const cleanLinks = Array.isArray(formData.sameAsLinks)
      ? formData.sameAsLinks.map((l) => l.trim()).filter((l) => l.length > 0)
      : [];

    // Updates database profile row matched explicitly to your session account ID
    await prisma.user.update({
      where: { id: session.id }, 
      data: {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(), // ✨ Commit email to Prisma user object context
        title: formData.title?.trim() || null,
        bio: formData.bio?.trim() || null,
        avatarUrl: formData.avatarUrl || null,
        sameAsLinks: cleanLinks,
      },
    });

    revalidatePath('/hq-portal');
    return { success: true };
  } catch (err) {
    console.error("Profile mutate crash logic:", err);
    return { success: false, error: "Internal update engine error" };
  }
}
