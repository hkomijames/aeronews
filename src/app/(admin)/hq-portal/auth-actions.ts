"use server";

import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';

export async function loginUser(email: string, passwordUnsecured: string) {
  try {
    // 1. Guard against blank submissions
    if (!email || !passwordUnsecured) {
      return { success: false, error: "Please enter both an email and password." };
    }

    // 2. Look up Lawson James profile by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    // If no email profile matches, fail silently with a generic message for security
    if (!user || !user.password) {
      return { success: false, error: "Invalid email or password match." };
    }

    // 3. Verify the plain-text password against your saved bcrypt hash
    const isPasswordCorrect = await bcrypt.compare(passwordUnsecured, user.password);

    if (!isPasswordCorrect) {
      return { success: false, error: "Invalid email or password match." };
    }

    // 4. Extract the user's role authorization flag ("ADMIN" or "AUTHOR")
    const userRole = user.role; 

    // 5. Store the session data inside a secure browser cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_session', JSON.stringify({ id: user.id, role: userRole }), {
      httpOnly: true, // Safeguards against client-side script inspection
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // Stays active for exactly 1 day
    });

    return { 
      success: true, 
      role: userRole 
    };

  } catch (error: any) {
    console.error("Authentication action failed:", error);
    return { success: false, error: "An unexpected authorization error occurred." };
  }
}

// ─── ADDED: SECURE LOGOUT ROUTINE FOR SESSIONS ───
export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    
    // Deletes the cookie instantly from the browser environment
    cookieStore.delete('auth_session');
    
    return { success: true };
  } catch (error) {
    console.error("Logout action failed:", error);
    return { success: false, error: "Could not safely terminate active session." };
  }
}
