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
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { auth, db } from "../firebaseCo";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

interface BookEntry {
  bookId?: string; // Now stores the book ID instead of just title
  title: string; // Keep for display and manual entries
  quantity: number;
  points: number;
  publisher: string;
  isBBTBook: boolean;
}

interface MonthlyReport {
  id?: string;
  month: string;
  year: number;
  totalBooks: number;
  totalPoints: number;
  books: BookEntry[];
  uploadedBy: string;
  uploadedAt: any;
  fileName: string;
}

interface FileInfo {
  name: string;
  uri?: string;
  file?: File; // For web
  type?: string;
  size?: number;
}

// Searchable Book Dropdown Component
interface SearchableBookDropdownProps {
  books: Book[];
  selectedBook?: Book | null;
  onBookSelect: (book: Book | null) => void;
  placeholder?: string;
  allowManualEntry?: boolean;
}

const SearchableBookDropdown: React.FC<SearchableBookDropdownProps> = ({
  books,
  selectedBook,
  onBookSelect,
  placeholder = "Search for a book...",
  allowManualEntry = true
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(books);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book =>
        book.title.toLowerCase().includes(searchText.toLowerCase()) ||
        book.author.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [searchText, books]);

  const handleBookSelect = (book: Book) => {
    onBookSelect(book);
    setIsDropdownOpen(false);
    setSearchText('');
  };

  const handleManualEntry = () => {
    onBookSelect(null); // Clear selection to allow manual entry
    setIsDropdownOpen(false);
    setSearchText('');
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleBookSelect(item)}
    >
      <View style={styles.bookItemContent}>
        <Text style={styles.bookItemTitle}>{item.title}</Text>
        <Text style={styles.bookItemAuthor}>by {item.author}</Text>
        {item.category && (
          <Text style={styles.bookItemCategory}>{item.category}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsDropdownOpen(true)}
      >
        <Text style={[
          styles.dropdownButtonText,
          !selectedBook && styles.dropdownPlaceholder
        ]}>
          {selectedBook ? selectedBook.title : placeholder}
        </Text>
        <Ionicons 
          name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>

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
              <TouchableOpacity
                onPress={() => setIsDropdownOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
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
              renderItem={renderBookItem}
              keyExtractor={(item) => item.id}
              style={styles.booksList}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No books found</Text>
                  {allowManualEntry && (
                    <TouchableOpacity
                      style={styles.manualEntryButton}
                      onPress={handleManualEntry}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
                      <Text style={styles.manualEntryText}>Enter manually</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />

            {allowManualEntry && filteredBooks.length > 0 && (
              <TouchableOpacity
                style={styles.manualEntryButton}
                onPress={handleManualEntry}
              >
                <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
                <Text style={styles.manualEntryText}>Enter book title manually</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 5 + i);

// Template structure for bulk upload
const TEMPLATE_DATA = [
  {
    bookId: "book123",
    title: "Bhagavad Gita As It Is",
    quantity: "10",
    points: "50",
    publisher: "BBT",
    isBBTBook: "true"
  },
  {
    bookId: "book456",
    title: "Srimad Bhagavatam Canto 1",
    quantity: "5",
    points: "25",
    publisher: "BBT",
    isBBTBook: "true"
  },
  {
    bookId: "",
    title: "Other Spiritual Book",
    quantity: "3",
    points: "15",
    publisher: "Other Publisher",
    isBBTBook: "false"
  }
];

export default function AdminBookLogging() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  
  // Form state for manual entry
  const [currentReport, setCurrentReport] = useState<Partial<MonthlyReport>>({
    month: MONTHS[new Date().getMonth()],
    year: CURRENT_YEAR,
    books: [],
    fileName: `Manual Entry - ${new Date().toISOString().split('T')[0]}`
  });

  // Single book entry form
  const [bookEntry, setBookEntry] = useState<BookEntry>({
    title: '',
    quantity: 1,
    points: 5,
    publisher: 'BBT',
    isBBTBook: true
  });

  useEffect(() => {
    fetchReports();
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const booksQuery = query(collection(db, 'books'), orderBy('title'));
      const querySnapshot = await getDocs(booksQuery);
      
      const fetchedBooks: Book[] = [];
      querySnapshot.forEach((doc) => {
        fetchedBooks.push({
          id: doc.id,
          ...doc.data(),
        } as Book);
      });

      setBooks(fetchedBooks);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch books: ' + error.message);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchReports = async () => {
    try {
      const reportsQuery = query(
        collection(db, 'bookReports'), // Changed from 'monthlyReports' to 'bookReports'
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      );
      const querySnapshot = await getDocs(reportsQuery);
      
      const fetchedReports: MonthlyReport[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReports.push({
          id: doc.id,
          ...doc.data(),
        } as MonthlyReport);
      });

      setReports(fetchedReports);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch reports: ' + error.message);
    }
  };

  const handleBookSelect = (book: Book | null) => {
    if (book) {
      setSelectedBook(book);
      setIsManualEntry(false);
      setBookEntry(prev => ({
        ...prev,
        bookId: book.id,
        title: book.title,
        // Auto-fill publisher if it's a BBT book (you can adjust this logic)
        publisher: book.title.toLowerCase().includes('bhagavad') || 
                   book.title.toLowerCase().includes('bhagavatam') || 
                   book.title.toLowerCase().includes('caitanya') ? 'BBT' : prev.publisher,
        isBBTBook: book.title.toLowerCase().includes('bhagavad') || 
                   book.title.toLowerCase().includes('bhagavatam') || 
                   book.title.toLowerCase().includes('caitanya')
      }));
    } else {
      // Manual entry mode
      setSelectedBook(null);
      setIsManualEntry(true);
      setBookEntry(prev => ({
        ...prev,
        bookId: undefined,
        title: ''
      }));
    }
  };

  const validateBookEntry = () => {
    if (!bookEntry.title.trim()) {
      Alert.alert('Error', 'Book title is required');
      return false;
    }
    if (bookEntry.quantity <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return false;
    }
    if (bookEntry.points < 0) {
      Alert.alert('Error', 'Points cannot be negative');
      return false;
    }
    return true;
  };

  const addBookToReport = () => {
    if (!validateBookEntry()) return;

    setCurrentReport(prev => ({
      ...prev,
      books: [...(prev.books || []), { ...bookEntry }]
    }));

    // Reset book entry form
    setBookEntry({
      title: '',
      quantity: 1,
      points: 5,
      publisher: 'BBT',
      isBBTBook: true
    });
    setSelectedBook(null);
    setIsManualEntry(false);
  };

  const removeBookFromReport = (index: number) => {
    setCurrentReport(prev => ({
      ...prev,
      books: prev.books?.filter((_, i) => i !== index) || []
    }));
  };

  const calculateReportTotals = (books: BookEntry[]) => {
    const totalBooks = books.reduce((sum, book) => sum + book.quantity, 0);
    const totalPoints = books.reduce((sum, book) => sum + (book.quantity * book.points), 0);
    return { totalBooks, totalPoints };
  };

  const handleSubmitReport = async () => {
    if (!currentReport.books || currentReport.books.length === 0) {
      Alert.alert('Error', 'Please add at least one book to the report');
      return;
    }

    setLoading(true);
    try {
      const { totalBooks, totalPoints } = calculateReportTotals(currentReport.books);
      
      const reportData: MonthlyReport = {
        month: currentReport.month!,
        year: currentReport.year!,
        totalBooks,
        totalPoints,
        books: currentReport.books,
        uploadedBy: auth.currentUser?.uid || 'unknown',
        uploadedAt: serverTimestamp(),
        fileName: currentReport.fileName!
      };

      // First save to bookReports collection
      await addDoc(collection(db, 'bookReports'), reportData);

      // Then save each book's rating to books-rating collection
      for (const book of currentReport.books) {
        if (book.bookId) {  // Only save ratings for books from the library
          await addDoc(collection(db, 'books-rating'), {
            bookId: book.bookId,
            title: book.title,
            quantity: book.quantity,
            points: book.points,
            month: currentReport.month,
            year: currentReport.year,
            timestamp: serverTimestamp(),
            uploadedBy: auth.currentUser?.uid || 'unknown'
          });
        }
      }

      Alert.alert('Success', 'Monthly report submitted successfully 🙏');
      
      // Reset form
      setCurrentReport({
        month: MONTHS[new Date().getMonth()],
        year: CURRENT_YEAR,
        books: [],
        fileName: `Manual Entry - ${new Date().toISOString().split('T')[0]}`
      });

      fetchReports();

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
        await processUploadedFile(asset);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const processUploadedFile = async (fileInfo: any) => {
    setUploading(true);
    try {
      let books: BookEntry[] = [];
      
      if (Platform.OS === 'web') {
        const text = await fileInfo.file.text();
        books = parseCSVContent(text);
      } else {
        const content = await FileSystem.readAsStringAsync(fileInfo.uri);
        books = parseCSVContent(content);
      }

      if (books.length === 0) {
        throw new Error('No valid book entries found in the file');
      }

      const { totalBooks, totalPoints } = calculateReportTotals(books);

      const reportData: MonthlyReport = {
        month: currentReport.month!,
        year: currentReport.year!,
        totalBooks,
        totalPoints,
        books,
        uploadedBy: auth.currentUser?.uid || 'unknown',
        uploadedAt: serverTimestamp(),
        fileName: fileInfo.name
      };

      // First save to bookReports collection
      await addDoc(collection(db, 'bookReports'), reportData);

      // Then save each book's rating to books-rating collection
      for (const book of books) {
        if (book.bookId) {  // Only save ratings for books from the library
          await addDoc(collection(db, 'books-rating'), {
            bookId: book.bookId,
            title: book.title,
            quantity: book.quantity,
            points: book.points,
            month: currentReport.month,
            year: currentReport.year,
            timestamp: serverTimestamp(),
            uploadedBy: auth.currentUser?.uid || 'unknown'
          });
        }
      }

      Alert.alert('Success', `Uploaded report with ${books.length} books successfully 🙏`);
      
      fetchReports();

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const parseCSVContent = (content: string): BookEntry[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const books: BookEntry[] = [];

    // Find column indices
    const bookIdIndex = headers.findIndex(h => h.includes('bookid') || h.includes('book_id'));
    const titleIndex = headers.findIndex(h => h.includes('title'));
    const quantityIndex = headers.findIndex(h => h.includes('quantity'));
    const pointsIndex = headers.findIndex(h => h.includes('points'));
    const publisherIndex = headers.findIndex(h => h.includes('publisher'));
    const isBBTIndex = headers.findIndex(h => h.includes('isbbt') || h.includes('is_bbt'));

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, '')); // Remove quotes
      
      if (values.length >= Math.max(titleIndex + 1, quantityIndex + 1)) {
        const book: BookEntry = {
          bookId: bookIdIndex >= 0 && values[bookIdIndex] ? values[bookIdIndex] : undefined,
          title: titleIndex >= 0 ? values[titleIndex] : values[0] || '',
          quantity: quantityIndex >= 0 ? parseInt(values[quantityIndex]) || 1 : 1,
          points: pointsIndex >= 0 ? parseInt(values[pointsIndex]) || 5 : 5,
          publisher: publisherIndex >= 0 ? values[publisherIndex] : 'BBT',
          isBBTBook: isBBTIndex >= 0 ? values[isBBTIndex]?.toLowerCase() === 'true' : true
        };
        
        if (book.title) {
          books.push(book);
        }
      }
    }

    return books;
  };

  const downloadTemplate = async () => {
    try {
      const headers = ['bookId', 'title', 'quantity', 'points', 'publisher', 'isBBTBook'];
      const csvContent = [
        headers.join(','),
        ...TEMPLATE_DATA.map(row => 
          `"${row.bookId}","${row.title}",${row.quantity},${row.points},"${row.publisher}",${row.isBBTBook}`
        )
      ].join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'book_report_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const csvPath = `${FileSystem.documentDirectory}book_report_template.csv`;
        await FileSystem.writeAsStringAsync(csvPath, csvContent);
        await Sharing.shareAsync(csvPath);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download template');
    }
  };

  const currentReportTotals = calculateReportTotals(currentReport.books || []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="library-outline" size={32} color="#FF8C42" />
        <Text style={styles.headerText}>Monthly Book Reports</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Report Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Period</Text>
          
          <View style={styles.row}>
            <View style={styles.pickerWrapper}>
              <Text style={styles.label}>Month</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={currentReport.month}
                  onValueChange={(value) => setCurrentReport(prev => ({ ...prev, month: value }))}
                  style={styles.picker}
                >
                  {MONTHS.map(month => (
                    <Picker.Item key={month} label={month} value={month} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.pickerWrapper}>
              <Text style={styles.label}>Year</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={currentReport.year}
                  onValueChange={(value) => setCurrentReport(prev => ({ ...prev, year: value }))}
                  style={styles.picker}
                >
                  {YEARS.map(year => (
                    <Picker.Item key={year} label={year.toString()} value={year} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Manual Book Entry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Books Manually</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Book Title *</Text>
            {loadingBooks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FF8C42" />
                <Text style={styles.loadingText}>Loading books...</Text>
              </View>
            ) : (
              <>
                {!isManualEntry ? (
                  <SearchableBookDropdown
                    books={books}
                    selectedBook={selectedBook}
                    onBookSelect={handleBookSelect}
                    placeholder="Search for a book or enter manually..."
                  />
                ) : (
                  <View>
                    <TextInput
                      style={styles.input}
                      value={bookEntry.title}
                      onChangeText={(text) => setBookEntry(prev => ({ ...prev, title: text }))}
                      placeholder="Enter book title manually"
                    />
                    <TouchableOpacity
                      style={styles.switchModeButton}
                      onPress={() => {
                        setIsManualEntry(false);
                        setBookEntry(prev => ({ ...prev, title: '', bookId: undefined }));
                      }}
                    >
                      <Ionicons name="search" size={16} color="#4CAF50" />
                      <Text style={styles.switchModeText}>Search from book list instead</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                value={bookEntry.quantity.toString()}
                onChangeText={(text) => setBookEntry(prev => ({ ...prev, quantity: parseInt(text) || 1 }))}
                placeholder="Quantity"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Points per Book *</Text>
              <TextInput
                style={styles.input}
                value={bookEntry.points.toString()}
                onChangeText={(text) => setBookEntry(prev => ({ ...prev, points: parseInt(text) || 5 }))}
                placeholder="Points"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Publisher</Text>
            <TextInput
              style={styles.input}
              value={bookEntry.publisher}
              onChangeText={(text) => setBookEntry(prev => ({ ...prev, publisher: text }))}
              placeholder="Publisher name"
            />
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, bookEntry.isBBTBook && styles.checkboxChecked]}
              onPress={() => setBookEntry(prev => ({ ...prev, isBBTBook: !prev.isBBTBook }))}
            >
              {bookEntry.isBBTBook && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>This is a BBT Book</Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={addBookToReport}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Add to Report</Text>
          </TouchableOpacity>
        </View>

        {/* Current Report Books */}
        {currentReport.books && currentReport.books.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Current Report ({currentReport.books.length} books)
            </Text>
            <View style={styles.totalsContainer}>
              <Text style={styles.totalText}>Total Books: {currentReportTotals.totalBooks}</Text>
              <Text style={styles.totalText}>Total Points: {currentReportTotals.totalPoints}</Text>
            </View>

            {currentReport.books.map((book, index) => (
              <View key={index} style={styles.bookItem}>
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>
                    {book.title}
                    {book.bookId && (
                      <Text style={styles.bookIdIndicator}> 📚</Text>
                    )}
                  </Text>
                  <Text style={styles.bookDetails}>
                    {book.bookId && <Text>ID: {book.bookId} | </Text>}
                    Qty: {book.quantity} | Points: {book.points} each | Publisher: {book.publisher}
                  </Text>
                  <Text style={styles.bookType}>
                    {book.isBBTBook ? '🟢 BBT Book' : '🔵 Other Book'} | Total Points: {book.quantity * book.points}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeBookFromReport(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmitReport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Bulk Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bulk Upload</Text>
          <Text style={styles.description}>
            Upload a CSV file with book entries for the selected month/year. 
            Include bookId column for books from the library (leave empty for manual entries).
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.templateButton]}
            onPress={downloadTemplate}
          >
            <Ionicons name="download-outline" size={20} color="#FF6B00" />
            <Text style={[styles.buttonText, styles.templateButtonText]}>Download Template</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.uploadButton, uploading && styles.buttonDisabled]}
            onPress={handleFilePicker}
            disabled={uploading}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {uploading ? 'Uploading...' : 'Upload CSV File'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reports History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports History ({reports.length})</Text>
          
          {reports.map((report, index) => (
            <View key={report.id || index} style={styles.reportCard}>
              <Text style={styles.reportTitle}>
                {report.month} {report.year}
              </Text>
              <Text style={styles.reportStats}>
                📚 Books: {report.totalBooks} | ⭐ Points: {report.totalPoints}
              </Text>
              <Text style={styles.reportFile}>📄 {report.fileName}</Text>
              <Text style={styles.reportDetails}>
                {report.books.length} unique titles
              </Text>
            </View>
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FF6B00',
    letterSpacing: 0.5,
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerWrapper: {
    flex: 1,
  },
  inputWrapper: {
    flex: 1,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
  },
  // Dropdown Styles
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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
  bookItemContent: {
    flex: 1,
  },
  bookItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookItemAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  bookItemCategory: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 20,
    backgroundColor: '#F0F8F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  manualEntryText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  switchModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
  },
  switchModeText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4CAF50',
  },
  bookIdIndicator: {
    fontSize: 12,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  reportTitle: {
    fontSize: 16,
    color: '#FF6B00',
    fontWeight: '500',
    marginBottom: 8,
  },
  reportStats: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reportFile: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  bookItem: {
    backgroundColor: '#FFF9F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    flexDirection: 'row',
  },
  bookTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    marginBottom: 4,
  },
  bookDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  addButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
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
  templateButton: {
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FF6B00',
    marginBottom: 12,
  },
  templateButtonText: {
    color: '#FF6B00',
  },
  uploadButton: {
    backgroundColor: '#FF6B00',
  },
});