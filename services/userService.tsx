//services/userService.tsx
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
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
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

  /** Upload image using ImagePicker and return base64 data URL */
  uploadImageFromGallery: async (): Promise<string | null> => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect for profile pictures
        quality: 0.6, // Reduced quality to minimize file size
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        // Check if the base64 string is too long (Firebase has limits)
        if (base64Image.length > 1000000) { // ~1MB limit
          Alert.alert(
            'Image Too Large', 
            'The selected image is quite large. It will be saved but may not sync across all services. Consider using a smaller image.'
          );
        }
        
        return base64Image;
      }
      
      return null;
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to select image');
      return null;
    }
  },

  /** Take photo using camera and return base64 data URL */
  takePhotoWithCamera: async (): Promise<string | null> => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square aspect for profile pictures
        quality: 0.6, // Reduced quality to minimize file size
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        // Check if the base64 string is too long
        if (base64Image.length > 1000000) { // ~1MB limit
          Alert.alert(
            'Image Too Large', 
            'The photo is quite large. It will be saved but may not sync across all services.'
          );
        }
        
        return base64Image;
      }
      
      return null;
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    }
  },

  /** Show image picker options (Gallery or Camera) */
  showImagePickerOptions: (
    onGallerySelect: () => void,
    onCameraSelect: () => void
  ) => {
    Alert.alert(
      'Select Image',
      'Choose an option to upload your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Gallery', onPress: onGallerySelect },
        { text: 'Camera', onPress: onCameraSelect },
      ]
    );
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

  /** Update a user's profile with image handling */
  updateUserProfileWithImage: async (
    uid: string, 
    user: FirebaseUser,
    updates: Partial<User>
  ) => {
    try {
      // Update Firestore document (can handle large base64 images)
      await updateDoc(doc(db, "users", uid), updates);

      // Update Firebase Auth profile with length restrictions
      const authUpdates: { displayName?: string; photoURL?: string } = {};
      
      if (updates.displayName !== undefined) {
        authUpdates.displayName = updates.displayName;
      }
      
      if (updates.photoURL !== undefined) {
        // Only update Auth photoURL if it's not a base64 image (too long for Auth)
        if (!updates.photoURL.startsWith('data:image/')) {
          authUpdates.photoURL = updates.photoURL;
        }
        // For base64 images, we skip updating Auth photoURL to avoid length error
      }

      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(user, authUpdates);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/invalid-profile-attribute') {
        // Retry without the photoURL for Auth, but keep Firestore update
        try {
          const retryAuthUpdates: { displayName?: string } = {};
          if (updates.displayName !== undefined) {
            retryAuthUpdates.displayName = updates.displayName;
          }
          
          if (Object.keys(retryAuthUpdates).length > 0) {
            await updateProfile(user, retryAuthUpdates);
          }
          
          return { 
            success: true, 
            warning: "Profile updated. Large images are stored locally but may not sync across all services." 
          };
        } catch (retryError) {
          return { success: false, error: retryError };
        }
      }
      
      return { success: false, error };
    }
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

  /** Validate image URL */
  isValidImageUrl: (url: string): boolean => {
    if (!url) return false;
    
    // Check if it's a base64 data URL
    if (url.startsWith('data:image/')) return true;
    
    // Check if it's a valid HTTP/HTTPS URL
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
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

  /** Format book interests array to comma-separated string */
  formatBookInterests: (interests: string[]): string => {
    return interests?.join(', ') || '';
  },

  /** Parse comma-separated book interests string to array */
  parseBookInterests: (interestsString: string): string[] => {
    return interestsString
      .split(',')
      .map(interest => interest.trim())
      .filter(interest => interest.length > 0);
  },

  /** Add book interest to existing interests */
  addBookInterest: (currentInterests: string[], newInterest: string): string[] => {
    const trimmedInterest = newInterest.trim();
    if (trimmedInterest && !currentInterests.includes(trimmedInterest)) {
      return [...currentInterests, trimmedInterest];
    }
    return currentInterests;
  },

  /** Remove book interest from existing interests */
  removeBookInterest: (currentInterests: string[], interestToRemove: string): string[] => {
    return currentInterests.filter(interest => interest !== interestToRemove);
  },
};

export default ProfileService;