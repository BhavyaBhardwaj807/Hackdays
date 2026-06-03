import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { useSettings } from './SettingsContext';

interface FirebaseContextType {
  db: any;
  auth: any;
  user: User | null;
  loading: boolean;
  signInWithGoogle: (credentialToken: string) => Promise<any>;
  isFirebaseActive: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseConfig, isDemo } = useSettings();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbInstance, setDbInstance] = useState<any>(null);
  const [authInstance, setAuthInstance] = useState<any>(null);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);

  useEffect(() => {
    console.log("firebaseConfig =", firebaseConfig);
    console.log("isDemo =", isDemo);

    // If we have an active config and are not strictly in offline-demo mode
    if (!isDemo) {
      try {
        // Temporary hardcoded config to isolate initialization bugs during debugging
        const configParsed = {
          apiKey: "AIzaSyDcv8YRcUAm8t5LMJ4XGkgTXHalDmodrfk",
          authDomain: "pulse-98bb6.firebaseapp.com",
          databaseURL: "https://pulse-98bb6-default-rtdb.firebaseio.com",
          projectId: "pulse-98bb6",
          storageBucket: "pulse-98bb6.firebasestorage.app",
          messagingSenderId: "308996917234",
          appId: "1:308996917234:web:31f486d024a5ae7e214d6b",
          measurementId: "G-6JTKMY9YPL",
        } as any;

        console.log('DEBUG Firebase configParsed (HARDCODED):', configParsed);

        const app = getApps().length === 0 ? initializeApp(configParsed) : getApp();
        
        // Initialize Firestore with robust multi-tab offline caching
        const db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });

        const auth = getAuth(app);

        // Sign in anonymously right away for zero friction
        signInAnonymously(auth)
          .then((cred) => {
            setUser(cred.user);
          })
          .catch((err) => {
            console.error("Firebase Anonymous Auth Failed:", err);
          });

        setDbInstance(db);
        setAuthInstance(auth);
        setIsFirebaseActive(true);

        const unsubscribe = auth.onAuthStateChanged((u) => {
          setUser(u);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("FIREBASE INIT ERROR:", err);
        setupLocalMock();
      }
    } else {
      setupLocalMock();
    }
  }, [firebaseConfig, isDemo]);

  const setupLocalMock = () => {
    setIsFirebaseActive(false);
    setDbInstance(null);
    setAuthInstance(null);
    // Create a mock user
    setUser({
      uid: 'pulse-mock-user-12345',
      isAnonymous: true,
      displayName: 'Dada-Dadi User',
      email: null,
    } as any);
    setLoading(false);
  };

  const signInWithGoogle = async (credentialToken: string) => {
    if (authInstance) {
      const credential = GoogleAuthProvider.credential(credentialToken);
      const res = await signInWithCredential(authInstance, credential);
      setUser(res.user);
      return res;
    } else {
      // Mock google login
      const mockGoogleUser = {
        uid: 'google-mock-user-54321',
        isAnonymous: false,
        displayName: 'Aarti Sharma',
        email: 'aarti.sharma@gmail.com',
        photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      };
      setUser(mockGoogleUser as any);
      return { user: mockGoogleUser };
    }
  };

  return (
    <FirebaseContext.Provider value={{
      db: dbInstance,
      auth: authInstance,
      user,
      loading,
      signInWithGoogle,
      isFirebaseActive
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
};
