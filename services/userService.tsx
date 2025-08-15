import { auth, db } from "../firebaseCo";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { User } from "../models/user.model"; // ✅ Import from models folder

const ProfileService = {
  /** Listen to authentication state changes */
  subscribeToAuth: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  /** Listen to real-time updates for a user's Firestore doc */
  subscribeToUserData: (
    uid: string,
    callback: (data: User | null) => void,
    errorCallback?: (error: any) => void
  ) => {
    const userDocRef = doc(db, "users", uid);
    return onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Omit<User, "registrationDate" | "lastActive"> & {
            registrationDate: Date;
            lastActive: Date;
          };
          callback(data as User);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error listening to user data:", error);
        if (errorCallback) errorCallback(error);
      }
    );
  },

  /** Get user data once (no real-time listener) */
  getUserDataOnce: async (uid: string): Promise<User | null> => {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  },

  /** Sign out the current user */
  logout: async () => {
    await signOut(auth);
  },

  /** Send a password reset email */
  forgotPassword: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },

  /** Update a user's role in Firestore */
  updateUserRole: async (uid: string, role: User["role"]) => {
    await updateDoc(doc(db, "users", uid), { role });
  },

  /** Update a user's Firestore profile fields */
  updateUserProfile: async (uid: string, updates: Partial<User>) => {
    await updateDoc(doc(db, "users", uid), updates);
  },

  /** Update the 'lastActive' timestamp for a user */
  updateLastActive: async (uid: string) => {
    await updateDoc(doc(db, "users", uid), { lastActive: serverTimestamp() });
  },

  /** Update Firebase Auth display name / photo URL */
  updateAuthProfile: async (user: FirebaseUser, updates: Partial<User>) => {
    await updateProfile(user, {
      displayName: updates.displayName,
      photoURL: updates.photoURL,
    });
  },

  /** Format Firestore Timestamp or Date */
  formatDate: (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  },
};

export default ProfileService;
