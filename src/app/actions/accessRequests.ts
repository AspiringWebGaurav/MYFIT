"use server";

import { adminDb } from "@/shared/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

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

    const lowerEmail = payload.email.toLowerCase();
    
    // Check unified requests structure first
    const requestsRef = adminDb.collection('access_requests');
    const docRef = requestsRef.doc(lowerEmail);
    const existingDoc = await docRef.get();

    if (existingDoc.exists) {
      const data = existingDoc.data()!;
      if (data.status === 'pending') {
        return { success: false, error: "Request already submitted" };
      }
      if (data.status === 'approved') {
        return { success: false, error: "Account already approved. Try logging in again." };
      }
      // If rejected or revoked, allow re-requesting by updating the document
      await docRef.update({
        status: 'pending',
        displayName: payload.displayName,
        timestamp: payload.timestamp || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      return { success: true, message: "Request Submitted" };
    }

    // Check legacy approved_users fallback
    const approvedRef = adminDb.collection('approved_users').doc(lowerEmail);
    const approvedDoc = await approvedRef.get();
    if (approvedDoc.exists) {
       return { success: false, error: "Account already approved. Try logging in again." };
    }

    // Create the new request
    await docRef.set({
      email: payload.email,
      displayName: payload.displayName,
      timestamp: payload.timestamp || FieldValue.serverTimestamp(),
      status: 'pending' // 'pending' | 'approved' | 'rejected' | 'revoked'
    });

    return { success: true, message: "Request Submitted" };

  } catch (error: any) {
    console.error("Error submitting access request:", error);
    return { success: false, error: "Failed to submit request" };
  }
}

export type AccountStatusResult = 
  | { status: 'approved' }
  | { status: 'pending' | 'rejected' | 'revoked' | 'unrequested' };

export async function checkAccountStatus(email: string): Promise<AccountStatusResult> {
  if (!email) return { status: 'unrequested' };
  const lowerEmail = email.toLowerCase();
  
  try {
    const requestsRef = adminDb.collection('access_requests');
    const docRef = requestsRef.doc(lowerEmail);
    const existingDoc = await docRef.get();
    
    if (existingDoc.exists) {
      const status = existingDoc.data()?.status;
      if (status === 'approved') return { status: 'approved' };
      if (status === 'pending') return { status: 'pending' };
      if (status === 'rejected') return { status: 'rejected' };
      if (status === 'revoked') return { status: 'revoked' };
    } else {
      // Auto-migrate from legacy approved_users if missing
      const approvedRef = adminDb.collection('approved_users').doc(lowerEmail);
      const approvedDoc = await approvedRef.get();
      
      if (approvedDoc.exists) {
        // Migrate to new structure
        await docRef.set({
          email: lowerEmail,
          displayName: 'Migrated User', // Fallback, auth handles real name
          timestamp: approvedDoc.data()?.approvedAt || FieldValue.serverTimestamp(),
          status: 'approved',
          approvedAt: approvedDoc.data()?.approvedAt || FieldValue.serverTimestamp()
        });
        return { status: 'approved' };
      }
    }
    
    // Legacy support: Check for old random-ID requests just in case
    const existingQuery = await requestsRef
      .where('email', '==', lowerEmail)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
      
    if (!existingQuery.empty) {
      const latestRequest = existingQuery.docs[0].data();
      if (latestRequest.status === 'pending') return { status: 'pending' };
      if (latestRequest.status === 'rejected') return { status: 'rejected' };
      if (latestRequest.status === 'revoked') return { status: 'revoked' };
    }
    
    return { status: 'unrequested' };
  } catch (error) {
    console.error("Error checking account status:", error);
    return { status: 'unrequested' };
  }
}
