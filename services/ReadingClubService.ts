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
const REGIONS_COLLECTION = 'regions';

// Add a new reading club
export const addReadingClub = async (
  club: Omit<ReadingClub, 'id' | 'createdAt' | 'updatedAt'>
) => {
  try {
    // First, create the reading club
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...club,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Then, add the club ID to the selected region's ReadingClubs array
    if (club.regionId) {
      const regionRef = doc(db, REGIONS_COLLECTION, club.regionId);
      await updateDoc(regionRef, {
        ReadingClubs: arrayUnion(docRef.id),
        updatedAt: serverTimestamp(),
      });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error adding reading club:', error);
    throw error;
  }
};

// Update an existing reading club
export const updateReadingClub = async (id: string, updatedData: Partial<ReadingClub>) => {
  try {
    // Get the current club data to check if region changed
    const currentClubRef = doc(db, COLLECTION_NAME, id);
    const currentClubSnap = await getDoc(currentClubRef);
    
    if (!currentClubSnap.exists()) {
      throw new Error('Reading club not found');
    }
    
    const currentClub = currentClubSnap.data() as ReadingClub;
    const oldRegionId = currentClub.regionId;
    const newRegionId = updatedData.regionId;

    // Update the reading club
    await updateDoc(currentClubRef, {
      ...updatedData,
      updatedAt: serverTimestamp(),
    });

    // Handle region changes
    if (newRegionId && oldRegionId !== newRegionId) {
      // Remove club ID from old region (if it exists)
      if (oldRegionId) {
        const oldRegionRef = doc(db, REGIONS_COLLECTION, oldRegionId);
        await updateDoc(oldRegionRef, {
          ReadingClubs: arrayRemove(id),
          updatedAt: serverTimestamp(),
        });
      }

      // Add club ID to new region
      const newRegionRef = doc(db, REGIONS_COLLECTION, newRegionId);
      await updateDoc(newRegionRef, {
        ReadingClubs: arrayUnion(id),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating reading club:', error);
    throw error;
  }
};

// Delete a reading club
export const deleteReadingClub = async (id: string) => {
  try {
    // Get the club data first to know which region to update
    const clubRef = doc(db, COLLECTION_NAME, id);
    const clubSnap = await getDoc(clubRef);
    
    if (clubSnap.exists()) {
      const clubData = clubSnap.data() as ReadingClub;
      
      // Remove club ID from the region's ReadingClubs array
      if (clubData.regionId) {
        const regionRef = doc(db, REGIONS_COLLECTION, clubData.regionId);
        await updateDoc(regionRef, {
          ReadingClubs: arrayRemove(id),
          updatedAt: serverTimestamp(),
        });
      }
    }

    // Delete the reading club
    await deleteDoc(clubRef);
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

// Utility function to get reading clubs by region
export const getReadingClubsByRegion = async (regionId: string): Promise<ReadingClub[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const clubs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as ReadingClub[];
    
    return clubs.filter(club => club.regionId === regionId);
  } catch (error) {
    console.error('Error fetching reading clubs by region:', error);
    throw error;
  }
};