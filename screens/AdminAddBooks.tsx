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
  Linking
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { auth, db } from "../firebaseCo";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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

// Add template structure
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
  const [uploading, setUploading] = useState(false);

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
      const bookData = {
        id: generateBookId(),
        ...book,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid,
      };

      await addDoc(collection(db, 'books'), bookData);
      Alert.alert('Success', 'Book added successfully 🙏');
      
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
          // Process CSV file
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

  // Add function to download template
  const downloadTemplate = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, create and download CSV
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
        // For mobile, create and share CSV
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

  // Add function to process spreadsheet
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

      // Validate and add books
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
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>Add Sacred Books</Text>
          <Text style={styles.headerSubtext}>BBT Books Collection</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Entry</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={book.title}
              onChangeText={(text) => setBook(prev => ({ ...prev, title: text }))}
              placeholder="Enter book title"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Author *</Text>
            <TextInput
              style={styles.input}
              value={book.author}
              onChangeText={(text) => setBook(prev => ({ ...prev, author: text }))}
              placeholder="Enter author name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={book.description}
              onChangeText={(text) => setBook(prev => ({ ...prev, description: text }))}
              placeholder="Enter book description"
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
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAddBook}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Add Book</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bulk Upload</Text>
          <Text style={styles.description}>
            Upload a CSV or JSON file containing books
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.templateButton]}
            onPress={downloadTemplate}
          >
            <Ionicons name="download-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Download Template</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.uploadButton, uploading && styles.buttonDisabled]}
            onPress={handleFilePicker}
            disabled={uploading}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {uploading ? 'Uploading...' : 'Upload File'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA',
    borderBottomWidth: 0,
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
    padding: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#1A1A1A',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
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
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginLeft: 8,
  },
  uploadButton: {
    backgroundColor: '#FF6B00',
  },
  templateButton: {
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FF6B00',
    marginBottom: 12,
  },
});