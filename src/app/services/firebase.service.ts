import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, addDoc, onSnapshot, collection, query, orderBy, deleteDoc, setLogLevel, Firestore, Unsubscribe, CollectionReference } from 'firebase/firestore';
import { isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db: Firestore | null = null;
  private authReady = false;
  private currentUserId: string | null = null;

  async initializeFirebase(): Promise<void> {
    if (isDevMode()) {
      setLogLevel('debug');
    }

    const firebaseConfig = JSON.parse((globalThis as any).__firebase_config || '{}');
    if (Object.keys(firebaseConfig).length === 0) {
      throw new Error("Firebase configuration is missing.");
    }

    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    const auth = getAuth(app);

    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.currentUserId = user.uid;
          this.authReady = true;
          resolve();
        } else {
          const token = (globalThis as any).__initial_auth_token;
          try {
            if (token) {
              await signInWithCustomToken(auth, token);
            } else {
              await signInAnonymously(auth);
            }
          } catch (e) {
            console.error("Auth Error:", e);
            throw new Error("Authentication failed.");
          }
        }
      });
    });
  }

  getDb(): Firestore {
    if (!this.db) throw new Error('Firebase not initialized');
    return this.db;
  }

  getUserId(): string | null {
    return this.currentUserId;
  }

  isAuthReady(): boolean {
    return this.authReady;
  }

  getCollectionPath(collectionName: string): string {
    const appId = (globalThis as any).__app_id || 'default-app-id';
    const currentUserId = this.currentUserId;
    if (!currentUserId) {
      return `artifacts/${appId}/temp/unknown/${collectionName}`;
    }
    return `artifacts/${appId}/users/${currentUserId}/${collectionName}`;
  }

  setupDataSubscription<T extends { timestamp: number }>(collectionName: string, dataSignal: (items: T[]) => void): Unsubscribe {
    const db = this.getDb();
    const entriesCollection = collection(db, this.getCollectionPath(collectionName)) as CollectionReference<T>;
    const q = query(entriesCollection, orderBy('timestamp', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      dataSignal(items);
    }, (err) => {
      console.error(`Firestore Error (${collectionName}):`, err);
    });
  }

  async addDocToCollection(collectionName: string, data: any): Promise<void> {
    const colRef = collection(this.getDb(), this.getCollectionPath(collectionName));
    await addDoc(colRef, data);
  }

  async deleteDocFromCollection(collectionName: string, id: string): Promise<void> {
    const docRef = doc(this.getDb(), this.getCollectionPath(collectionName), id);
    await deleteDoc(docRef);
  }
}
