import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    DocumentData,
    getDoc,
    getDocs,
    orderBy,
    query,
    QueryDocumentSnapshot,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../firebaseCo';

const TEMPLES_COLLECTION = 'temples';
const REGIONS_COLLECTION = 'regions';

// Temple model interface - simplified without storage references
export interface Temple {
  id: string;
  name: string;
  description?: string;
  regionId: string;
  regionName?: string;
  imageUrl?: string; // Simple URL string
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface Region {
  id: string;
  name: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

// Simplified interface - just URL input
export interface TempleInput {
  name: string;
  description?: string;
  regionId: string;
  imageUrl?: string; // Direct URL input or data URL
}

export interface TempleCountByRegion {
  [regionId: string]: number;
}

export const TempleService = {
  // Get all temples
  async getTemples(): Promise<Temple[]> {
    try {
      const templesRef = collection(db, TEMPLES_COLLECTION);
      const q = query(templesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const temples: Temple[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        temples.push({
          id: doc.id,
          ...doc.data()
        } as Temple);
      });
      
      return temples;
    } catch (error) {
      console.error('Error getting temples:', error);
      throw new Error('Failed to fetch temples');
    }
  },

  // Get temple by ID
  async getTempleById(id: string): Promise<Temple> {
    try {
      const templeRef = doc(db, TEMPLES_COLLECTION, id);
      const templeSnap = await getDoc(templeRef);
      
      if (templeSnap.exists()) {
        return {
          id: templeSnap.id,
          ...templeSnap.data()
        } as Temple;
      } else {
        throw new Error('Temple not found');
      }
    } catch (error) {
      console.error('Error getting temple:', error);
      throw new Error('Failed to fetch temple');
    }
  },

  // Get temples by region
  async getTemplesByRegion(regionId: string): Promise<Temple[]> {
    try {
      const templesRef = collection(db, TEMPLES_COLLECTION);
      // Remove orderBy to avoid composite index requirement; sort client-side instead
      const q = query(
        templesRef,
        where('regionId', '==', regionId)
      );
      const querySnapshot = await getDocs(q);
      
      const temples: Temple[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        temples.push({
          id: doc.id,
          ...doc.data()
        } as Temple);
      });

      // Sort locally by name to keep UI consistent
      temples.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      return temples;
    } catch (error) {
      console.error('Error getting temples by region:', error);
      throw new Error('Failed to fetch temples for region');
    }
  },

  // Add new temple - simplified
  async addTemple(templeData: TempleInput): Promise<Temple> {
    try {
      // Get region name for reference
      const regionName = await this.getRegionName(templeData.regionId);
      
      const newTemple = {
        name: templeData.name.trim(),
        description: templeData.description?.trim() || '',
        regionId: templeData.regionId,
        regionName: regionName,
        imageUrl: templeData.imageUrl?.trim() || '', // Store URL directly (including data URLs)
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const templesRef = collection(db, TEMPLES_COLLECTION);
      const docRef = await addDoc(templesRef, newTemple);
      
      return {
        id: docRef.id,
        ...newTemple
      };
    } catch (error) {
      console.error('Error adding temple:', error);
      throw new Error('Failed to create temple');
    }
  },

  // Update temple - simplified
  async updateTemple(id: string, templeData: TempleInput): Promise<Temple> {
    try {
      // Get existing temple
      const existingTemple = await this.getTempleById(id);
      
      // Get region name for reference
      const regionName = await this.getRegionName(templeData.regionId);
      
      const updatedTemple: Partial<Temple> = {
        name: templeData.name.trim(),
        description: templeData.description?.trim() || '',
        regionId: templeData.regionId,
        regionName: regionName,
        imageUrl: templeData.imageUrl?.trim() || '', // Store URL directly (including data URLs)
        updatedAt: new Date()
      };

      const templeRef = doc(db, TEMPLES_COLLECTION, id);
      await updateDoc(templeRef, updatedTemple);
      
      return {
        id,
        ...updatedTemple,
        createdAt: existingTemple.createdAt
      } as Temple;
    } catch (error) {
      console.error('Error updating temple:', error);
      throw new Error('Failed to update temple');
    }
  },

  // Delete temple - simplified (no image deletion needed)
  async deleteTemple(id: string): Promise<boolean> {
    try {
      const templeRef = doc(db, TEMPLES_COLLECTION, id);
      await deleteDoc(templeRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting temple:', error);
      throw new Error('Failed to delete temple');
    }
  },

  // Get all regions for dropdown
  async getRegions(): Promise<Region[]> {
    try {
      const regionsRef = collection(db, REGIONS_COLLECTION);
      const q = query(regionsRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const regions: Region[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        regions.push({
          id: doc.id,
          ...doc.data()
        } as Region);
      });
      
      return regions;
    } catch (error) {
      console.error('Error getting regions:', error);
      throw new Error('Failed to fetch regions');
    }
  },

  // Helper method to get region name
  async getRegionName(regionId: string): Promise<string> {
    try {
      const regionRef = doc(db, REGIONS_COLLECTION, regionId);
      const regionSnap = await getDoc(regionRef);
      
      if (regionSnap.exists()) {
        return regionSnap.data().name;
      } else {
        return 'Unknown Region';
      }
    } catch (error) {
      console.error('Error getting region name:', error);
      return 'Unknown Region';
    }
  },

  // Search temples
  searchTemples(temples: Temple[], searchTerm: string): Temple[] {
    if (!searchTerm.trim()) {
      return temples;
    }

    const term = searchTerm.toLowerCase();
    return temples.filter((temple: Temple) =>
      temple.name.toLowerCase().includes(term) ||
      temple.description?.toLowerCase().includes(term) ||
      temple.regionName?.toLowerCase().includes(term)
    );
  },

  // Validate temple data - updated to handle data URLs
  validateTempleData(templeData: TempleInput): string[] {
    const errors: string[] = [];

    if (!templeData.name || !templeData.name.trim()) {
      errors.push('Temple name is required');
    }

    if (templeData.name && templeData.name.trim().length < 2) {
      errors.push('Temple name must be at least 2 characters long');
    }

    if (!templeData.regionId) {
      errors.push('Region selection is required');
    }

    if (templeData.description && templeData.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    // Enhanced URL validation to handle both regular URLs and data URLs
    if (templeData.imageUrl && templeData.imageUrl.trim()) {
      const imageUrl = templeData.imageUrl.trim();
      
      // Check if it's a data URL (base64)
      const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
      
      // Check if it's a regular HTTP/HTTPS URL
      const httpUrlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
      
      // Must be either a valid data URL or a valid HTTP URL
      if (!dataUrlPattern.test(imageUrl) && !httpUrlPattern.test(imageUrl)) {
        errors.push('Image must be either a valid HTTP/HTTPS link to an image file (jpg, png, gif, webp) or an uploaded image');
      }
      
      // Check data URL size (rough estimate - base64 is ~33% larger than original)
      if (dataUrlPattern.test(imageUrl)) {
        const base64Data = imageUrl.split(',')[1];
        if (base64Data && base64Data.length > 2000000) { // ~1.5MB limit for base64
          errors.push('Uploaded image is too large. Please choose a smaller image.');
        }
      }
    }

    return errors;
  },

  // Get temple count by region
  async getTempleCountByRegion(): Promise<TempleCountByRegion> {
    try {
      const temples = await this.getTemples();
      const countByRegion: TempleCountByRegion = {};

      temples.forEach((temple: Temple) => {
        const regionId = temple.regionId;
        countByRegion[regionId] = (countByRegion[regionId] || 0) + 1;
      });

      return countByRegion;
    } catch (error) {
      console.error('Error getting temple count by region:', error);
      throw new Error('Failed to get temple statistics');
    }
  }
};

export default TempleService;