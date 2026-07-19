import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db'; // Correct absolute alias mapping

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');
    if (!sessionCookie) return null;
    return JSON.parse(sessionCookie.value);
  } catch (err) {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getSessionUser();
    
    // Safeguard to skip compilation-checks gracefully
    if (!session || !session.email) {
      return NextResponse.json({ error: "Unauthorized session token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        bio: true,
        avatarUrl: true,
        sameAsLinks: true,
        role: true,
      }
    });

    if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile metadata" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !session.email) {
      return NextResponse.json({ error: "Unauthorized session token" }, { status: 401 });
    }

    const body = await request.json();
    const { name, title, bio, avatarUrl, sameAsLinks } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Display Name is required" }, { status: 400 });
    }

    const cleanLinks = Array.isArray(sameAsLinks)
      ? sameAsLinks.map((l: string) => l.trim()).filter((l: string) => l.length > 0)
      : [];

    const updatedUser = await prisma.user.update({
      where: { email: session.email },
      data: {
        name: name.trim(),
        title: title?.trim() || null,
        bio: bio?.trim() || null,
        avatarUrl: avatarUrl || null,
        sameAsLinks: cleanLinks,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Profile Edit Error:", error);
    return NextResponse.json({ error: "Internal update engine error" }, { status: 500 });
  }
}
