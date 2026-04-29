import { initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  enableIndexedDbPersistence,
  getFirestore,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

export type SubmissionInput = {
  name: string
  email: string
  message: string
}

export type Submission = SubmissionInput & {
  id: string
  createdAtMs?: number
}


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

let persistenceEnabled: boolean | null = null
export function getPersistenceEnabled(): boolean | null {
  return persistenceEnabled
}

// Enable Firestore offline persistence (IndexedDB).
// This allows:
// - reads to be served from local cache when offline (after first successful sync)
// - writes to be queued and synced automatically when back online
//
// Note: This can fail in some situations (e.g. multiple tabs open).
enableIndexedDbPersistence(db)
  .then(() => {
    persistenceEnabled = true
  })
  .catch(() => {
  // Keep app functional even if persistence can't be enabled.
    persistenceEnabled = false
  })

export async function addSubmission(data: SubmissionInput): Promise<void> {
  await addDoc(collection(db, 'submissions'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function getSubmissions(): Promise<Submission[]> {
  const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((doc) => {
    const d = doc.data() as {
      name?: unknown
      email?: unknown
      message?: unknown
      createdAt?: Timestamp
    }
    return {
      id: doc.id,
      name: typeof d.name === 'string' ? d.name : '',
      email: typeof d.email === 'string' ? d.email : '',
      message: typeof d.message === 'string' ? d.message : '',
      createdAtMs: d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : undefined,
    }
  })
}

export async function syncOfflineQueue(queue: SubmissionInput[]): Promise<void> {
  // Write submissions one-by-one to preserve order and keep retry logic simple.
  for (const item of queue) {
    await addSubmission(item)
  }
}

