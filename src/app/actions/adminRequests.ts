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
  status: 'pending' | 'approved' | 'rejected';
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

  const batch = adminDb.batch();
  
  // 1. Add to approved_users
  const approvedRef = adminDb.collection('approved_users').doc(email.toLowerCase());
  batch.set(approvedRef, {
    email: email.toLowerCase(),
    approvedAt: FieldValue.serverTimestamp()
  });

  // 2. Update request status
  const requestRef = adminDb.collection('access_requests').doc(id);
  batch.update(requestRef, { status: 'approved' });

  await batch.commit();
  revalidatePath('/admin');
  return { success: true };
}

export async function rejectRequest(id: string) {
  const isAdmin = await checkAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  await adminDb.collection('access_requests').doc(id).update({
    status: 'rejected'
  });
  
  revalidatePath('/admin');
  return { success: true };
}
