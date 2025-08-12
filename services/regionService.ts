import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebaseCo';
import { Region } from '../models/region.model';

const COLLECTION_NAME = 'regions';

// Create a new region
export const addRegion = async (region: Omit<Region, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), region);
  return docRef.id;
};

// Get all regions
export const getRegions = async (): Promise<Region[]> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Region, 'id'>),
  }));
};

// Get a single region by ID
export const getRegionById = async (id: string): Promise<Region | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as Omit<Region, 'id'>) };
  }
  return null;
};

// Update an existing region
export const updateRegion = async (
  id: string,
  updatedData: Partial<Region>
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updatedData);
};

// Delete a region
export const deleteRegion = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
