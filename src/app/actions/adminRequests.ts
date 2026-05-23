"use server";

import { adminDb } from "@/shared/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { checkAdminStatus } from "./adminAuth";
import { revalidatePath } from "next/cache";

export interface AccessRequest {
  id: string;
  email: string;
  displayName: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
}

export async function getPendingRequests(): Promise<AccessRequest[]> {
  const isAdmin = await checkAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const snapshot = await adminDb.collection('access_requests')
    .where('status', '==', 'pending')
    .orderBy('timestamp', 'desc')
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      displayName: data.displayName,
      timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp,
      status: data.status
    } as AccessRequest;
  });
}

export async function approveRequest(id: string, email: string) {
  const isAdmin = await checkAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const requestRef = adminDb.collection('access_requests').doc(id);
  await requestRef.update({ 
    status: 'approved',
    approvedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: 'admin'
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function rejectRequest(id: string) {
  const isAdmin = await checkAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  await adminDb.collection('access_requests').doc(id).update({
    status: 'rejected',
    rejectedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: 'admin'
  });
  
  revalidatePath('/admin');
  return { success: true };
}

export async function revokeRequest(id: string) {
  const isAdmin = await checkAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  await adminDb.collection('access_requests').doc(id).update({
    status: 'revoked',
    revokedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: 'admin'
  });
  
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteRequest(id: string, email: string) {
  const isAdmin = await checkAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const batch = adminDb.batch();
  
  // Delete from new structure (id is usually the lowercased email)
  batch.delete(adminDb.collection('access_requests').doc(id));
  
  // Delete using exact ID just in case it's a legacy doc with uppercase letters
  batch.delete(adminDb.collection('approved_users').doc(id));
  
  // Try to delete from legacy structure using email just in case
  if (email) {
    batch.delete(adminDb.collection('approved_users').doc(email.toLowerCase()));
    batch.delete(adminDb.collection('approved_users').doc(email));
  }

  await batch.commit();
  revalidatePath('/admin');
  return { success: true };
}

export async function getHistoryRequests(): Promise<AccessRequest[]> {
  const isAdmin = await checkAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  // Fetch all to avoid requiring a composite index for where() + orderBy()
  const snapshot = await adminDb.collection('access_requests').get();
  
  // Also fetch legacy approved_users to show them in history before they auto-migrate
  const legacySnapshot = await adminDb.collection('approved_users').get();

  const historyMap = new Map<string, AccessRequest>();

  // Process legacy users first
  legacySnapshot.docs.forEach(doc => {
    const data = doc.data();
    const email = doc.id; // Using doc.id since legacy was stored as email ID
    historyMap.set(email, {
      id: doc.id,
      email: data.email || email,
      displayName: 'Migrated User',
      timestamp: data.approvedAt?.toMillis ? data.approvedAt.toMillis() : Date.now(),
      status: 'approved'
    });
  });

  // Process new unified requests (overwriting legacy if they exist in both)
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.status === 'approved' || data.status === 'rejected' || data.status === 'revoked') {
      historyMap.set(data.email?.toLowerCase(), {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        timestamp: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp),
        status: data.status
      });
    }
  });

  const history = Array.from(historyMap.values())
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return history;
}
