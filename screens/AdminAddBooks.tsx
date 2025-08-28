import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  FlatList,
  StatusBar
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { auth, db } from "../firebaseCo";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { generateBookId } from '../utils/idGenerator';

interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  publishYear?: number;
  bbtMediaLink?: string;
  category?: string;
  language?: string;
  format?: 'PDF' | 'EPUB' | 'HTML' | 'Audio';
  rating?: number;
  isFavorite?: boolean;
  createdAt?: any;
}

const CATEGORIES = [
  'Scripture',
  'Commentary',
  'Biography',
  'Philosophy',
  'Other'
];

const LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Sanskrit',
  'Other'
];

const FORMATS = ['PDF', 'EPUB', 'HTML', 'Audio'];

const TEMPLATE_DATA = [
  {
    title: "Book Title",
    author: "Author Name",
    description: "Book Description",
    publishYear: "2023",
    bbtMediaLink: "https://link-to-bbt.com",
    category: "Scripture",
    language: "English",
    format: "PDF"
  }
];

export default function AdminAddBooks() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [book, setBook] = useState<Partial<Book>>({
    title: '',
    author: '',
    description: '',
    category: 'Scripture',
    language: 'English',
    format: 'PDF',
    publishYear: undefined,
    bbtMediaLink: '',
    rating: 5,
  });

  // Fetch books from Firestore
  useEffect(() => {
    const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const booksData: Book[] = [];
      querySnapshot.forEach((doc) => {
        booksData.push({ ...doc.data() as Book, id: doc.id });
      });
      setBooks(booksData);
    });

    return () => unsubscribe();
  }, []);

  const validateBook = () => {
    if (!book.title?.trim()) {
      Alert.alert('Error', 'Book title is required');
      return false;
    }
    if (!book.author?.trim()) {
      Alert.alert('Error', 'Author name is required');
      return false;
    }
    return true;
  };

  const handleAddBook = async () => {
    if (!validateBook()) return;

    setLoading(true);
    try {
      if (editingBook) {
        // Update existing book
        const bookRef = doc(db, 'books', editingBook.id);
        await updateDoc(bookRef, {
          ...book,
          updatedAt: serverTimestamp(),
        });
        Alert.alert('Success', 'Book updated successfully 🙏');
        setEditingBook(null);
      } else {
        // Add new book
        const bookData = {
          id: generateBookId(),
          ...book,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid,
        };
        await addDoc(collection(db, 'books'), bookData);
        Alert.alert('Success', 'Book added successfully 🙏');
      }
      
      // Reset form
      setBook({
        title: '',
        author: '',
        description: '',
        category: 'Scripture',
        language: 'English',
        format: 'PDF',
        publishYear: undefined,
        bbtMediaLink: '',
        rating: 5,
      });

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBook = (bookToEdit: Book) => {
    setEditingBook(bookToEdit);
    setBook({
      title: bookToEdit.title,
      author: bookToEdit.author,
      description: bookToEdit.description || '',
      category: bookToEdit.category || 'Scripture',
      language: bookToEdit.language || 'English',
      format: bookToEdit.format || 'PDF',
      publishYear: bookToEdit.publishYear,
      bbtMediaLink: bookToEdit.bbtMediaLink || '',
      rating: bookToEdit.rating || 5,
    });
  };

  const handleCancelEdit = () => {
    setEditingBook(null);
    setBook({
      title: '',
      author: '',
      description: '',
      category: 'Scripture',
      language: 'English',
      format: 'PDF',
      publishYear: undefined,
      bbtMediaLink: '',
      rating: 5,
    });
  };

  const handleViewBook = (bookToView: Book) => {
    setViewingBook(bookToView);
  };

  const handleDeleteBook = async (bookId: string) => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to delete this book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'books', bookId));
              Alert.alert('Success', 'Book deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/csv'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const response = await fetch(asset.uri);
        const contentType = response.headers.get('content-type');

        if (contentType === 'application/json') {
          const books = await response.json();

          if (!Array.isArray(books)) {
            throw new Error('Invalid file format. Expected array of books.');
          }

          setLoading(true);
          let added = 0;

          for (const bookData of books) {
            try {
              await addDoc(collection(db, 'books'), {
                id: generateBookId(),
                ...bookData,
                createdAt: serverTimestamp(),
                createdBy: auth.currentUser?.uid,
              });
              added++;
            } catch (error) {
              console.error('Error adding book:', error);
            }
          }

          Alert.alert('Success', `Added ${added} books successfully 🙏`);
        } else if (contentType === 'text/csv') {
          await processSpreadsheet(asset);
        } else {
          throw new Error('Unsupported file type. Please upload a JSON or CSV file.');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      if (Platform.OS === 'web') {
        const headers = Object.keys(TEMPLATE_DATA[0]).join(',');
        const csv = `${headers}\n${TEMPLATE_DATA.map(row => 
          Object.values(row).join(',')
        ).join('\n')}`;
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'books_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const csvPath = `${FileSystem.documentDirectory}books_template.csv`;
        const headers = Object.keys(TEMPLATE_DATA[0]).join(',');
        const csv = `${headers}\n${TEMPLATE_DATA.map(row => 
          Object.values(row).join(',')
        ).join('\n')}`;
        
        await FileSystem.writeAsStringAsync(csvPath, csv);
        await Sharing.shareAsync(csvPath);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download template');
    }
  };

  const processSpreadsheet = async (fileInfo: any) => {
    try {
      setUploading(true);
      let books = [];
      
      if (Platform.OS === 'web') {
        const text = await fileInfo.file.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        
        books = rows.slice(1).map(row => {
          const values = row.split(',');
          const book: any = {};
          headers.forEach((header, index) => {
            book[header.trim()] = values[index]?.trim();
          });
          return book;
        });
      } else {
        const result = await FileSystem.readAsStringAsync(fileInfo.uri);
        const rows = result.split('\n');
        const headers = rows[0].split(',');
        
        books = rows.slice(1).map(row => {
          const values = row.split(',');
          const book: any = {};
          headers.forEach((header, index) => {
            book[header.trim()] = values[index]?.trim();
          });
          return book;
        });
      }

      for (const bookData of books) {
        if (bookData.title && bookData.author) {
          await addDoc(collection(db, 'books'), {
            id: generateBookId(),
            ...bookData,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid,
          });
        }
      }

      Alert.alert('Success', `Added ${books.length} books successfully 🙏`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <View style={styles.bookItem}>
      <View style={styles.bookHeader}>
        <View style={styles.bookIcon}>
          <Text style={styles.bookIconText}>📖</Text>
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <Text style={styles.bookAuthor}>by {item.author}</Text>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewBook(item)}
          >
            <Ionicons name="eye-outline" size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditBook(item)}
          >
            <Ionicons name="create-outline" size={16} color="#FF6B00" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteBook(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF6B00" />
          </TouchableOpacity>
        </View>
      </View>
      {item.description && (
        <Text style={styles.bookDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.bookDetails}>
        {item.publishYear && (
          <Text style={styles.bookDetail}>Year: {item.publishYear}</Text>
        )}
        {item.language && (
          <Text style={styles.bookDetail}>Language: {item.language}</Text>
        )}
        {item.format && (
          <Text style={styles.bookDetail}>Format: {item.format}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      
      <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>Add Sacred Books</Text>
          <Text style={styles.headerSubtext}>BBT Books Collection</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Manual Entry Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {editingBook ? 'Edit Book' : 'Manual Entry'}
            </Text>
            {editingBook && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {editingBook && (
            <View style={styles.editingNotice}>
              <Ionicons name="create-outline" size={16} color="#FF6B00" />
              <Text style={styles.editingNoticeText}>
                Editing: {editingBook.title}
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={book.title}
              onChangeText={(text) => setBook(prev => ({ ...prev, title: text }))}
              placeholder="Enter book title"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Author *</Text>
            <TextInput
              style={styles.input}
              value={book.author}
              onChangeText={(text) => setBook(prev => ({ ...prev, author: text }))}
              placeholder="Enter author name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={book.description}
              onChangeText={(text) => setBook(prev => ({ ...prev, description: text }))}
              placeholder="Enter book description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={book.category}
                onValueChange={(value) => setBook(prev => ({ ...prev, category: value }))}
                style={styles.picker}
              >
                {CATEGORIES.map(category => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Language</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={book.language}
                onValueChange={(value) => setBook(prev => ({ ...prev, language: value }))}
                style={styles.picker}
              >
                {LANGUAGES.map(lang => (
                  <Picker.Item key={lang} label={lang} value={lang} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Format</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={book.format}
                onValueChange={(value) => setBook(prev => ({ ...prev, format: value }))}
                style={styles.picker}
              >
                {FORMATS.map(format => (
                  <Picker.Item key={format} label={format} value={format} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Publish Year</Text>
            <TextInput
              style={styles.input}
              value={book.publishYear?.toString()}
              onChangeText={(text) => setBook(prev => ({ ...prev, publishYear: parseInt(text) || undefined }))}
              placeholder="Enter publish year"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>BBT Media Link</Text>
            <TextInput
              style={styles.input}
              value={book.bbtMediaLink}
              onChangeText={(text) => setBook(prev => ({ ...prev, bbtMediaLink: text }))}
              placeholder="Enter BBT Media link"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAddBook}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons 
                  name={editingBook ? "checkmark-circle-outline" : "add-circle-outline"} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.buttonText}>
                  {editingBook ? 'Update Book' : 'Add Book'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Bulk Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bulk Upload</Text>
          <Text style={styles.description}>
            Upload a CSV or JSON file containing books
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.templateButton]}
            onPress={downloadTemplate}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={20} color="#FF6B00" />
            <Text style={[styles.buttonText, { color: '#FF6B00' }]}>Download Template</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, uploading && styles.buttonDisabled]}
            onPress={handleFilePicker}
            disabled={uploading}
            activeOpacity={0.9}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {uploading ? 'Uploading...' : 'Upload File'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Added Books Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Added Books</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{books.length}</Text>
            </View>
          </View>
          
          {books.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📚</Text>
              <Text style={styles.emptyStateText}>No books added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start by adding your first sacred book above
              </Text>
            </View>
          ) : (
            <FlatList
              data={books}
              renderItem={renderBookItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* View Book Modal */}
        {viewingBook && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Book Details</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setViewingBook(null)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalBookHeader}>
                  <View style={styles.modalBookIcon}>
                    <Text style={styles.modalBookIconText}>📖</Text>
                  </View>
                  <View style={styles.modalBookInfo}>
                    <Text style={styles.modalBookTitle}>{viewingBook.title}</Text>
                    <Text style={styles.modalBookAuthor}>by {viewingBook.author}</Text>
                    {viewingBook.category && (
                      <View style={styles.modalCategoryBadge}>
                        <Text style={styles.modalCategoryText}>{viewingBook.category}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {viewingBook.description && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Description</Text>
                    <Text style={styles.modalSectionContent}>{viewingBook.description}</Text>
                  </View>
                )}
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Details</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Language:</Text>
                    <Text style={styles.modalDetailValue}>{viewingBook.language || 'Not specified'}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Format:</Text>
                    <Text style={styles.modalDetailValue}>{viewingBook.format || 'Not specified'}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Publish Year:</Text>
                    <Text style={styles.modalDetailValue}>{viewingBook.publishYear || 'Not specified'}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Rating:</Text>
                    <Text style={styles.modalDetailValue}>{viewingBook.rating || 'Not rated'}</Text>
                  </View>
                </View>
                
                {viewingBook.bbtMediaLink && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>BBT Media Link</Text>
                    <Text style={styles.modalLinkText}>{viewingBook.bbtMediaLink}</Text>
                  </View>
                )}
              </ScrollView>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.button, styles.modalEditButton]}
                  onPress={() => {
                    setViewingBook(null);
                    handleEditBook(viewingBook);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#FF6B00" />
                  <Text style={[styles.buttonText, { color: '#FF6B00', marginLeft: 4 }]}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  helpButton: {
  position: 'absolute',
  bottom: 20,
  right: 20,
  backgroundColor: '#FFF4E6',
  borderRadius: 50,
  padding: 12,
  elevation: 3,
  shadowColor: '#FF6B00',
  shadowOpacity: 0.3,
},
guideStep: {
  fontSize: 14,
  marginBottom: 12,
  color: '#333',
  lineHeight: 20,
},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA',
  },
  headerText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  headerSubtext: {
    fontSize: 12,
    color: '#999',
    fontWeight: '300',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  countBadge: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF6B00',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: '300',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '400',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#FF6B00',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#FFB380',
    elevation: 1,
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginLeft: 8,
  },
  templateButton: {
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FF6B00',
    elevation: 1,
    shadowOpacity: 0.05,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#1A1A1A',
    fontWeight: '400',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '300',
  },
  bookItem: {
    backgroundColor: '#FFF9F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  bookHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF4E6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookIconText: {
    fontSize: 18,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '300',
  },
  categoryBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FF6B00',
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    color: '#FF6B00',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  cancelButtonText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
  editingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  editingNoticeText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
    marginLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalBookHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalBookIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF4E6',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalBookIconText: {
    fontSize: 24,
  },
  modalBookInfo: {
    flex: 1,
  },
  modalBookTitle: {
    fontSize: 20,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 26,
  },
  modalBookAuthor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    fontWeight: '300',
  },
  modalCategoryBadge: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF6B00',
    alignSelf: 'flex-start',
  },
  modalCategoryText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    marginBottom: 12,
  },
  modalSectionContent: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    fontWeight: '300',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  modalLinkText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalEditButton: {
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FF6B00',
    elevation: 1,
    shadowOpacity: 0.05,
  },
  bookDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: '300',
  },
  bookDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bookDetail: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
});