"use server";

import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateUserProfile(formData: {
  name: string;
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
    if (!session.email) return { success: false, error: "Invalid session metadata" };

    if (!formData.name || !formData.name.trim()) {
      return { success: false, error: "Display Name is required" };
    }

    const cleanLinks = Array.isArray(formData.sameAsLinks)
      ? formData.sameAsLinks.map((l) => l.trim()).filter((l) => l.length > 0)
      : [];

    await prisma.user.update({
      where: { email: session.email },
      data: {
        name: formData.name.trim(),
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
