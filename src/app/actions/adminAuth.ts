"use server";

import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = 'myfit_admin_session';

export async function adminLogin(adminKey: string) {
  try {
    const validKey = process.env.ADMIN_KEY;
    if (!validKey) {
       console.error("ADMIN_KEY is not set in environment variables");
       return { success: false, error: "Server configuration error" };
    }

    if (adminKey === validKey) {
      // Set secure HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set(ADMIN_SESSION_COOKIE, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/'
      });
      return { success: true };
    }

    return { success: false, error: "Invalid Admin Key" };
  } catch (error) {
    console.error("Admin login error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return { success: true };
}

export async function checkAdminStatus() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE);
  return session?.value === 'authenticated';
}
