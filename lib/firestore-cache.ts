import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function sanitizeDocId(key: string): string {
  return key
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 500);
}

export interface FirestoreCacheMeta<T> {
  data: T;
  isStale: boolean;
  expiresAt: number;
}

export async function getFirestoreCache<T>(
  key: string,
  options?: { allowStale?: boolean }
): Promise<T | null> {
  const result = await getFirestoreCacheWithMeta<T>(key);
  if (!result) return null;
  if (result.isStale && !options?.allowStale) return null;
  return result.data;
}

export async function getFirestoreCacheWithMeta<T>(key: string): Promise<FirestoreCacheMeta<T> | null> {
  try {
    const docId = sanitizeDocId(key);
    const docRef = doc(db, 'media_cache', docId);

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 400));
    
    const readPromise = (async (): Promise<FirestoreCacheMeta<T> | null> => {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;

      const docData = snap.data();
      if (!docData || !docData.expiresAt || typeof docData.expiresAt !== 'number') return null;

      const now = Date.now();
      const staleUntil = typeof docData.staleUntil === 'number' ? docData.staleUntil : docData.expiresAt * 2;
      
      if (now > staleUntil && now > docData.expiresAt) {
        return null;
      }

      if (docData.data) {
        const parsed = JSON.parse(docData.data) as T;
        const isStale = now > docData.expiresAt;
        return {
          data: parsed,
          isStale,
          expiresAt: docData.expiresAt,
        };
      }
      return null;
    })().catch((err) => {
      if (err?.code !== 'unavailable' && !err?.message?.includes('offline')) {
        console.debug?.(`[Firestore Cache Read] Key: ${key}`, err?.message || err);
      }
      return null;
    });

    return await Promise.race([readPromise, timeoutPromise]);
  } catch (err: any) {
    if (err?.code !== 'unavailable' && !err?.message?.includes('offline')) {
      console.debug?.(`[Firestore Cache Read] Key: ${key}`, err?.message || err);
    }
    return null;
  }
}

export async function setFirestoreCache<T>(
  key: string,
  data: T,
  ttlMs: number,
  staleWindowMs?: number
): Promise<void> {
  try {
    const docId = sanitizeDocId(key);
    const docRef = doc(db, 'media_cache', docId);

    const expiresAt = Date.now() + ttlMs;
    const staleUntil = Date.now() + (staleWindowMs ?? Math.max(ttlMs * 3, 48 * 60 * 60 * 1000));
    const jsonStr = JSON.stringify(data);

    setDoc(docRef, {
      key,
      data: jsonStr,
      expiresAt,
      staleUntil,
      updatedAt: new Date().toISOString(),
    }).catch((err) => {
      if (err?.code !== 'unavailable' && !err?.message?.includes('offline')) {
        console.debug?.(`[Firestore Cache Write Background] Key: ${key}`, err?.message || err);
      }
    });
  } catch (err: any) {
    if (err?.code !== 'unavailable' && !err?.message?.includes('offline')) {
      console.debug?.(`[Firestore Cache Write Error] Key: ${key}`, err?.message || err);
    }
  }
}
