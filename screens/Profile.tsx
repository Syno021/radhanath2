import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from 'expo-image-picker';
import { signOut, updateProfile, User } from "firebase/auth";
import { collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from "../app/navigation/AppNavigator";
import { auth, db } from "../firebaseCo";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  keyof RootStackParamList
>;

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  photoURL: string;
  region: string;
  registrationDate: any;
  lastActive: any;
  pushToken: string;
  bookInterests: string[];
  joinedGroups: string[];
  joinedReadingClubs: string[];
  role: string;
}

interface EditFormData {
  displayName: string;
  phoneNumber: string;
  region: string;
  photoURL: string;
  bookInterests: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  category?: string;
}

const SearchableBookDropdown: React.FC<{
  books: Book[];
  onBookSelect: (book: Book) => void;
  placeholder?: string;
}> = ({ books, onBookSelect, placeholder = "Search for a book..." }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(books);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book =>
        book.title.toLowerCase().includes(searchText.toLowerCase()) ||
        (book.author && book.author.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredBooks(filtered);
    }
  }, [searchText, books]);

  return (
    <Modal
      visible={isDropdownOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsDropdownOpen(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select a Book</Text>
            <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by title or author..."
              autoFocus={true}
            />
          </View>

          <FlatList
            data={filteredBooks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  onBookSelect(item);
                  setIsDropdownOpen(false);
                }}
              >
                <Text style={styles.bookItemTitle}>{item.title}</Text>
                {item.author && <Text style={styles.bookItemSubtext}>by {item.author}</Text>}
                {item.category && <Text style={styles.bookItemSubtext}>{item.category}</Text>}
              </TouchableOpacity>
            )}
            style={styles.booksList}
          />
        </View>
      </View>
    </Modal>
  );
};

const BookList: React.FC<{
  visible: boolean;
  onClose: () => void;
  onBookSelect: (book: Book) => void;
}> = ({ visible, onClose, onBookSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const booksQuery = query(collection(db, 'books'), orderBy('title'));
      const snapshot = await getDocs(booksQuery);
      const fetchedBooks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Book));
      setBooks(fetchedBooks);
    } catch (error) {
      Alert.alert('Error', 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#FDFCFA' }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#FFE4CC',
          paddingTop: 60
        }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Ionicons name="close" size={24} color="#FF6B00" />
          </TouchableOpacity>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#FF6B00',
            marginLeft: 16
          }}>Select Books</Text>
        </View>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: '#FFFFFF'
        }}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 16,
              color: '#333'
            }}
            placeholder="Search books..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FF6B00" />
          </View>
        ) : (
          <FlatList
            data={filteredBooks}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#FFE4CC',
                  backgroundColor: '#FFFFFF'
                }}
                onPress={() => {
                  onBookSelect(item);
                  onClose();
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#333',
                  marginBottom: 4
                }}>{item.title}</Text>
                {item.author && (
                  <Text style={{
                    fontSize: 14,
                    color: '#666'
                  }}>by {item.author}</Text>
                )}
                {item.category && (
                  <Text style={{
                    fontSize: 12,
                    color: '#999',
                    marginTop: 4
                  }}>{item.category}</Text>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </Modal>
  );
};

export default function Profile() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { width } = useWindowDimensions();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    displayName: '',
    phoneNumber: '',
    region: '',
    photoURL: '',
    bookInterests: '',
  });
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [showBookList, setShowBookList] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const fetchUserData = async (uid: string) => {
    try {
      setLoading(true);
      
      const userDocRef = doc(db, "users", uid);
      const unsubscribeDoc = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as UserData;
          setUserData(data);
          // Update form data when user data changes
          setEditFormData({
            displayName: data.displayName || '',
            phoneNumber: data.phoneNumber || '',
            region: data.region || '',
            photoURL: data.photoURL || '',
            bookInterests: data.bookInterests?.join(', ') || '',
          });
        } else {
          console.log("No user document found");
          setUserData(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load profile data");
        setLoading(false);
      });

      return unsubscribeDoc;
    } catch (error) {
      console.error("Error setting up user data listener:", error);
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const booksQuery = query(collection(db, 'books'), orderBy('title'));
      const querySnapshot = await getDocs(booksQuery);
      
      const fetchedBooks: Book[] = [];
      querySnapshot.forEach((doc) => {
        fetchedBooks.push({ id: doc.id, ...doc.data() } as Book);
      });

      setBooks(fetchedBooks);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch books: ' + error.message);
    } finally {
      setLoadingBooks(false);
    }
  };

  const onRefresh = async () => {
    if (currentUser) {
      setRefreshing(true);
      await fetchUserData(currentUser.uid);
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.navigate("Login");
            } catch (error: any) {
              console.error("Sign out error:", error);
              Alert.alert("Error", "Failed to sign out");
            }
          },
        },
      ]
    );
  };

  const handleEditPress = () => {
    if (userData) {
      setEditFormData({
        displayName: userData.displayName || '',
        phoneNumber: userData.phoneNumber || '',
        region: userData.region || '',
        photoURL: userData.photoURL || '',
        bookInterests: userData.bookInterests?.join(', ') || '',
      });
      setIsEditModalVisible(true);
    }
  };

  const handleImageUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }
      setImageLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect for profile pictures
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]?.base64) {
        const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setEditFormData(prev => ({ ...prev, photoURL: dataUrl }));
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !userData) return;

    setSaving(true);
    try {
      // Prepare updates for Firestore
      const firestoreUpdates = {
        displayName: editFormData.displayName.trim(),
        phoneNumber: editFormData.phoneNumber.trim(),
        region: editFormData.region.trim(),
        photoURL: editFormData.photoURL.trim(),
        bookInterests: editFormData.bookInterests
          .split(',')
          .map(interest => interest.trim())
          .filter(interest => interest.length > 0),
      };

      // Update Firestore document (stores full base64 or URL)
      await updateDoc(doc(db, "users", currentUser.uid), firestoreUpdates);

      // For Firebase Auth, handle base64 images differently
      const authUpdates: { displayName?: string; photoURL?: string } = {
        displayName: firestoreUpdates.displayName,
      };

      // If it's a base64 image, don't update Auth photoURL (too long)
      // If it's a regular URL, update Auth photoURL
      if (firestoreUpdates.photoURL && !firestoreUpdates.photoURL.startsWith('data:image/')) {
        authUpdates.photoURL = firestoreUpdates.photoURL;
      } else if (firestoreUpdates.photoURL.startsWith('data:image/')) {
        // For base64 images, set a placeholder or leave Auth photoURL unchanged
        authUpdates.photoURL = userData.photoURL?.startsWith('data:image/') 
          ? currentUser.photoURL || '' // Keep existing Auth photoURL if it's not base64
          : firestoreUpdates.photoURL; // This will fail, so we skip it
        delete authUpdates.photoURL; // Remove to avoid the error
      } else {
        authUpdates.photoURL = ''; // Clear if no image
      }

      // Update Firebase Auth profile (only with compatible photoURL)
      await updateProfile(currentUser, authUpdates);

      Alert.alert("Success", "Profile updated successfully!");
      setIsEditModalVisible(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.code === 'auth/invalid-profile-attribute') {
        Alert.alert("Error", "Image too large for profile. The image has been saved but may not sync across all Firebase services.");
      } else {
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const addBookInterest = () => {
    if (newInterest.trim()) {
      const currentInterests = editFormData.bookInterests
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0);
      
      if (!currentInterests.includes(newInterest.trim())) {
        const updatedInterests = [...currentInterests, newInterest.trim()];
        setEditFormData(prev => ({
          ...prev,
          bookInterests: updatedInterests.join(', ')
        }));
      }
      setNewInterest('');
    }
  };

  const removeBookInterest = (interestToRemove: string) => {
    const updatedInterests = editFormData.bookInterests
      .split(',')
      .map(interest => interest.trim())
      .filter(interest => interest.length > 0 && interest !== interestToRemove);
    
    setEditFormData(prev => ({
      ...prev,
      bookInterests: updatedInterests.join(', ')
    }));
  };

  const handleBookSelect = (book: Book) => {
    const currentInterests = editFormData.bookInterests
      .split(',')
      .map(interest => interest.trim())
      .filter(interest => interest.length > 0);
    
    if (!currentInterests.includes(book.title)) {
      const updatedInterests = [...currentInterests, book.title];
      setEditFormData(prev => ({
        ...prev,
        bookInterests: updatedInterests.join(', ')
      }));
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const EditModal = () => (
    <Modal
      visible={isEditModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, backgroundColor: '#FDFCFA' }}>
          {/* Modal Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 20,
            backgroundColor: '#FDFCFA',
            borderBottomWidth: 1,
            borderBottomColor: '#FFE4CC'
          }}>
            <TouchableOpacity
              onPress={() => setIsEditModalVisible(false)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#DDD'
              }}
            >
              <Text style={{
                color: '#666',
                fontSize: 14,
                fontWeight: '500'
              }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#FF6B00',
              letterSpacing: 0.5
            }}>
              Edit Profile
            </Text>
            
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saving}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: saving ? '#FFB380' : '#FF6B00'
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '500'
                }}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Picture Section */}
            <View style={{
              alignItems: 'center',
              marginBottom: 32
            }}>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: '#FFF9F5',
                borderWidth: 3,
                borderColor: '#FF6B00',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
              }}>
                {editFormData.photoURL ? (
                  <Image
                    source={{ uri: editFormData.photoURL }}
                    style={{
                      width: 94,
                      height: 94,
                      borderRadius: 47
                    }}
                    onError={() => {
                      Alert.alert("Error", "Invalid image");
                    }}
                  />
                ) : (
                  <Text style={{
                    fontSize: 36,
                    color: '#FF6B00',
                    fontWeight: '300'
                  }}>
                    {editFormData.displayName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                onPress={handleImageUpload}
                disabled={imageLoading}
                style={{
                  backgroundColor: imageLoading ? '#FFB380' : '#FF6B00',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16
                }}
              >
                {imageLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: '500'
                  }}>
                    Change Photo
                  </Text>
                )}
              </TouchableOpacity>
              
              <Text style={{
                fontSize: 16,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 8
              }}>
                Or Enter Photo URL
              </Text>
              <TextInput
                style={{
                  width: '100%',
                  borderWidth: 1,
                  borderColor: '#FFE4CC',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: '#FFFFFF',
                  fontSize: 16,
                  textAlign: 'center'
                }}
                value={editFormData.photoURL.startsWith('data:') ? '' : editFormData.photoURL}
                onChangeText={(text) => setEditFormData(prev => ({ ...prev, photoURL: text }))}
                placeholder="https://example.com/photo.jpg"
                keyboardType="url"
              />
            </View>

            {/* Form Fields */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              elevation: 3,
              shadowColor: '#FF6B00',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              marginBottom: 24
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '500',
                color: '#FF6B00',
                marginBottom: 20
              }}>
                Personal Information
              </Text>

              {/* Display Name */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  color: '#FF6B00',
                  fontWeight: '500',
                  marginBottom: 8
                }}>
                  Display Name
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#FFE4CC',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: '#FDFCFA',
                    fontSize: 16
                  }}
                  value={editFormData.displayName}
                  onChangeText={(text) => setEditFormData(prev => ({ ...prev, displayName: text }))}
                  placeholder="Enter your display name"
                />
              </View>

              {/* Phone Number */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  color: '#FF6B00',
                  fontWeight: '500',
                  marginBottom: 8
                }}>
                  Phone Number
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#FFE4CC',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: '#FDFCFA',
                    fontSize: 16
                  }}
                  value={editFormData.phoneNumber}
                  onChangeText={(text) => setEditFormData(prev => ({ ...prev, phoneNumber: text }))}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Region */}
              <View style={{ marginBottom: 0 }}>
                <Text style={{
                  fontSize: 14,
                  color: '#FF6B00',
                  fontWeight: '500',
                  marginBottom: 8
                }}>
                  Region
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#FFE4CC',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: '#FDFCFA',
                    fontSize: 16
                  }}
                  value={editFormData.region}
                  onChangeText={(text) => setEditFormData(prev => ({ ...prev, region: text }))}
                  placeholder="Enter your region"
                />
              </View>
            </View>

            {/* Book Interests Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Book Interests</Text>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF6B00',
                  padding: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16
                }}
                onPress={() => setShowBookList(true)}
              >
                <Ionicons name="book-outline" size={20} color="#FFFFFF" />
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  marginLeft: 8
                }}>Browse Books</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {editFormData.bookInterests.split(',').map((interest, index) => {
                  const trimmedInterest = interest.trim();
                  if (!trimmedInterest) return null;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => removeBookInterest(trimmedInterest)}
                      style={styles.interestTag}
                    >
                      <Text style={styles.interestText}>{trimmedInterest}</Text>
                      <Text style={styles.removeInterest}>×</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <BookList
                visible={showBookList}
                onClose={() => setShowBookList(false)}
                onBookSelect={handleBookSelect}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FDFCFA' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={{
            fontSize: 16,
            color: '#666',
            marginTop: 16,
            fontWeight: '300'
          }}>
            Loading profile...
          </Text>
        </View>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FDFCFA' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={{
            fontSize: 24,
            color: '#FF6B00',
            fontWeight: '300',
            textAlign: 'center',
            marginBottom: 16
          }}>
            Not Signed In
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 22
          }}>
            Please sign in to view your profile
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#FF6B00',
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderRadius: 12
            }}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '600'
            }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFCFA' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FDFCFA'
      }}>
        <View>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#FF6B00',
            letterSpacing: 0.5
          }}>
            My Profile
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleEditPress}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: '#FF6B00',
              marginRight: 12
            }}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: '500'
            }}>
              Edit
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#FF6B00'
            }}
          >
            <Text style={{
              color: '#FF6B00',
              fontSize: 14,
              fontWeight: '500'
            }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Header */}
        <View style={{
          paddingHorizontal: 24,
          paddingVertical: 20,
          alignItems: 'center'
        }}>
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#FFF9F5',
            borderWidth: 3,
            borderColor: '#FF6B00',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          }}>
            {userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={{
                  width: 94,
                  height: 94,
                  borderRadius: 47
                }}
              />
            ) : (
              <Text style={{
                fontSize: 36,
                color: '#FF6B00',
                fontWeight: '300'
              }}>
                {userData?.displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          
          <Text style={{
            fontSize: 24,
            fontWeight: '300',
            color: '#1A1A1A',
            textAlign: 'center',
            marginBottom: 4
          }}>
            {userData?.displayName || currentUser.displayName || 'No Name'}
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: '#666',
            fontWeight: '300'
          }}>
            {userData?.email || currentUser.email}
          </Text>
          
          {userData?.role && (
            <View style={{
              backgroundColor: '#FF6B00',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginTop: 8
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: '500',
                textTransform: 'capitalize'
              }}>
                {userData.role}
              </Text>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View style={{
          paddingHorizontal: 24,
          marginBottom: 20
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            elevation: 3,
            shadowColor: '#FF6B00',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#FF6B00',
              marginBottom: 20
            }}>
              Account Information
            </Text>

            {/* Phone Number */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Phone Number
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {userData?.phoneNumber || 'Not provided'}
              </Text>
            </View>

            {/* Region */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Region
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {userData?.region || 'Not specified'}
              </Text>
            </View>

            {/* Registration Date */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Member Since
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {formatDate(userData?.registrationDate)}
              </Text>
            </View>

            {/* Last Active */}
            <View>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Last Active
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {formatDate(userData?.lastActive)}
              </Text>
            </View>
          </View>
        </View>

        {/* Interests & Activities */}
        <View style={{
          paddingHorizontal: 24,
          marginBottom: 20
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            elevation: 3,
            shadowColor: '#FF6B00',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#FF6B00',
              marginBottom: 20
            }}>
              My Activities
            </Text>

            {/* Book Interests */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 8
              }}>
                Book Interests ({userData?.bookInterests?.length || 0})
              </Text>
              {userData?.bookInterests?.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {userData.bookInterests.map((interest, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: '#FFF9F5',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        marginRight: 8,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: '#FFE4CC'
                      }}
                    >
                      <Text style={{
                        fontSize: 12,
                        color: '#FF6B00',
                        fontWeight: '400'
                      }}>
                        {interest}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{
                  fontSize: 14,
                  color: '#999',
                  fontStyle: 'italic'
                }}>
                  No interests added yet
                </Text>
              )}
            </View>

            {/* Joined Groups */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Joined Groups
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {userData?.joinedGroups?.length || 0} groups
              </Text>
            </View>

            {/* Reading Clubs */}
            <View>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Reading Clubs
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {userData?.joinedReadingClubs?.length || 0} clubs
              </Text>
            </View>
          </View>
        </View>

        {/* Spiritual Quote */}
        <View style={{
          paddingHorizontal: 24,
          paddingVertical: 20,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            fontWeight: '300',
            fontStyle: 'italic',
            lineHeight: 20,
            letterSpacing: 0.2
          }}>
            "The supreme goal of human life is to{'\n'}develop love for Krishna."
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#999',
            marginTop: 8,
            fontWeight: '400'
          }}>
            - Srila Prabhupada
          </Text>
          <View style={{
            width: 30,
            height: 1,
            backgroundColor: '#DDD',
            marginTop: 12
          }} />
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <EditModal />
    </View>
  );
}

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%' as const,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    margin: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  booksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bookItemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  bookItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  interestTag: {
    backgroundColor: '#FFF9F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  interestText: {
    fontSize: 14,
    color: '#FF6B00',
    marginRight: 4,
  },
  removeInterest: {
    fontSize: 16,
    color: '#FF6B00',
    fontWeight: '600' as const,
    fontWeight: '600' as const,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 3,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500' as const,
    fontWeight: '500' as const,
    color: '#FF6B00',
    marginBottom: 16
  },
};