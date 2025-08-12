// services/readingClubService.ts
import { db } from '../firebaseCo';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { ReadingClub } from '../models/ReadingClub.model';

const COLLECTION_NAME = 'reading-clubs';

// Add a new reading club
export const addReadingClub = async (
  club: Omit<ReadingClub, 'id' | 'createdAt' | 'updatedAt'>
) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...club,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding reading club:', error);
    throw error;
  }
};

// Update an existing reading club
export const updateReadingClub = async (id: string, updatedData: Partial<ReadingClub>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating reading club:', error);
    throw error;
  }
};

// Delete a reading club
export const deleteReadingClub = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting reading club:', error);
    throw error;
  }
};

// Get all reading clubs
export const getReadingClubs = async (): Promise<ReadingClub[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as ReadingClub[];
  } catch (error) {
    console.error('Error fetching reading clubs:', error);
    throw error;
  }
};

// Get single reading club
export const getReadingClubById = async (id: string): Promise<ReadingClub | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ReadingClub;
    }
    return null;
  } catch (error) {
    console.error('Error fetching reading club:', error);
    throw error;
  }
};

// Get regions from Firestore
export const getRegions = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'regions'));
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      name: docSnap.data().name,
    }));
  } catch (error) {
    console.error('Error fetching regions:', error);
    throw error;
  }
};

// Request to join a reading club (adds userId to joinRequests array)
export const requestToJoinClub = async (clubId: string, userId: string) => {
  try {
    const clubRef = doc(db, COLLECTION_NAME, clubId);
    await updateDoc(clubRef, {
      joinRequests: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error requesting to join club:', error);
    throw error;
  }
};

// Approve a join request (moves userId from joinRequests → members)
export const approveJoinRequest = async (clubId: string, userId: string) => {
  try {
    const clubRef = doc(db, COLLECTION_NAME, clubId);
    await updateDoc(clubRef, {
      members: arrayUnion(userId),
      joinRequests: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error approving join request:', error);
    throw error;
  }
};
