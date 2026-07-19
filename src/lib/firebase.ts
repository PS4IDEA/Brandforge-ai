import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Helpers to read/write custom Firebase config from localStorage
export function getClientFirebaseConfig(): any {
  const stored = localStorage.getItem('brandforge_client_firebase_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function setClientFirebaseConfig(config: any): void {
  if (config) {
    localStorage.setItem('brandforge_client_firebase_config', typeof config === 'string' ? config : JSON.stringify(config));
  } else {
    localStorage.removeItem('brandforge_client_firebase_config');
  }
}

export function isClientFirebaseActive(): boolean {
  return !!getClientFirebaseConfig();
}

// Get active config (custom first, then default)
export function getActiveFirebaseConfig() {
  const custom = getClientFirebaseConfig();
  return custom || firebaseConfig;
}

const activeConfig = getActiveFirebaseConfig();

// Initialize Firebase with either the custom or default configuration
const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();

export const auth = getAuth(app);
export const db = (activeConfig as any).firestoreDatabaseId
  ? getFirestore(app, (activeConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  GENERATIONS: 'generations',
  LOGOS: 'logos'
};

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  orderBy
};
export type { FirebaseUser };
