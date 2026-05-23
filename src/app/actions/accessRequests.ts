"use server";

import { adminDb } from "@/shared/firebase/admin";

export type SubmitAccessRequestResult = 
  | { success: true; message: string }
  | { success: false; error: string; rateLimited?: boolean };

// Store IPs/Emails in memory for basic rate limiting in Serverless environments
// Note: In Vercel, this is per-instance, but it's enough for basic spam protection
const rateLimitCache = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

export async function submitAccessRequest(payload: { email: string; displayName: string; timestamp: number }): Promise<SubmitAccessRequestResult> {
  try {
    if (!payload.email) {
      return { success: false, error: "Email is required" };
    }

    // Basic Rate Limiting
    const now = Date.now();
    const cacheKey = `access_request_${payload.email}`;
    const lastRequest = rateLimitCache.get(cacheKey);

    if (lastRequest && (now - lastRequest) < RATE_LIMIT_WINDOW) {
       return { success: false, error: "Please wait before requesting again", rateLimited: true };
    }

    // Update rate limit cache
    rateLimitCache.set(cacheKey, now);

    // Clean up old rate limit entries (simple GC)
    if (rateLimitCache.size > 1000) {
      for (const [key, val] of rateLimitCache.entries()) {
        if (now - val > RATE_LIMIT_WINDOW) {
          rateLimitCache.delete(key);
        }
      }
    }

    // Check if the user is already approved (in case they haven't re-logged in)
    const approvedRef = adminDb.collection('approved_users').doc(payload.email.toLowerCase());
    const approvedDoc = await approvedRef.get();
    if (approvedDoc.exists) {
       return { success: false, error: "Account already approved. Try logging in again." };
    }

    // Check for duplicate pending requests
    const requestsRef = adminDb.collection('access_requests');
    const existingQuery = await requestsRef
      .where('email', '==', payload.email)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return { success: false, error: "Request already submitted" };
    }

    // Create the new request
    await requestsRef.add({
      email: payload.email,
      displayName: payload.displayName,
      timestamp: payload.timestamp || adminDb.FieldValue.serverTimestamp(),
      status: 'pending' // 'pending' | 'approved' | 'rejected'
    });

    return { success: true, message: "Request Submitted" };

  } catch (error: any) {
    console.error("Error submitting access request:", error);
    return { success: false, error: "Failed to submit request" };
  }
}
