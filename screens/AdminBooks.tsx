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
import GuideOverlay from '../components/GuideOverlay';

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
  bookId?: string;
  title: string;
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
    onBookSelect(null);
    setIsDropdownOpen(false);
    setSearchText('');
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity style={styles.dropdownItem} onPress={() => handleBookSelect(item)}>
      <View>
        <Text style={styles.bookItemTitle}>{item.title}</Text>
        <Text style={styles.bookItemSubtext}>by {item.author}</Text>
        {item.category && <Text style={styles.bookItemSubtext}>{item.category}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={() => setIsDropdownOpen(true)}>
        <Text style={[styles.inputText, !selectedBook && styles.placeholder]}>
          {selectedBook ? selectedBook.title : placeholder}
        </Text>
        <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#666" />
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
              renderItem={renderBookItem}
              keyExtractor={(item) => item.id}
              style={styles.booksList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No books found</Text>
                  {allowManualEntry && (
                    <TouchableOpacity style={styles.manualEntryButton} onPress={handleManualEntry}>
                      <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
                      <Text style={styles.manualEntryText}>Enter manually</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />

            {allowManualEntry && filteredBooks.length > 0 && (
              <TouchableOpacity style={styles.manualEntryButton} onPress={handleManualEntry}>
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
  const [loadingReports, setLoadingReports] = useState(false);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [showGuide, setShowGuide] = useState(false);
  
  const [currentReport, setCurrentReport] = useState<Partial<MonthlyReport>>({
    month: MONTHS[new Date().getMonth()],
    year: CURRENT_YEAR,
    books: [],
    fileName: `Manual Entry - ${new Date().toISOString().split('T')[0]}`
  });

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

  useEffect(() => {
    if (reports && reports.length > 0) {
      const initial: Record<string, boolean> = {};
      reports.forEach((r, idx) => {
        const key = r.id || `${r.month}-${r.year}-${idx}`;
        initial[key] = false; // collapsed by default, optimized for performance
      });
      setExpandedReports(initial);
    }
  }, [reports]);

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

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const fetchAllReports = async () => {
        const reportsRef = collection(db, 'bookReports');
        const querySnapshot = await getDocs(reportsRef); // Changed from reportsQuery to reportsRef
        
        const allReports: MonthlyReport[] = [];
        querySnapshot.forEach((doc) => {
          allReports.push({ 
            id: doc.id, 
            ...doc.data() 
          } as MonthlyReport);
        });

        // Sort reports by year and month
        allReports.sort((a, b) => {
          if (a.year !== b.year) {
            return b.year - a.year; // Most recent year first
          }
          // If same year, sort by month (December to January)
          return MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month);
        });

        return allReports;
      };

      const allReports = await fetchAllReports();
      console.log('Total reports fetched:', allReports.length);
      setReports(allReports);
      
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to fetch reports: ' + error.message);
    } finally {
      setLoadingReports(false);
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
        publisher: book.title.toLowerCase().includes('bhagavad') || 
                   book.title.toLowerCase().includes('bhagavatam') || 
                   book.title.toLowerCase().includes('caitanya') ? 'BBT' : prev.publisher,
        isBBTBook: book.title.toLowerCase().includes('bhagavad') || 
                   book.title.toLowerCase().includes('bhagavatam') || 
                   book.title.toLowerCase().includes('caitanya')
      }));
    } else {
      setSelectedBook(null);
      setIsManualEntry(true);
      setBookEntry(prev => ({ ...prev, bookId: undefined, title: '' }));
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

      await addDoc(collection(db, 'bookReports'), reportData);

      for (const book of currentReport.books) {
        if (book.bookId) {
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

      await addDoc(collection(db, 'bookReports'), reportData);

      for (const book of books) {
        if (book.bookId) {
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

    const bookIdIndex = headers.findIndex(h => h.includes('bookid') || h.includes('book_id'));
    const titleIndex = headers.findIndex(h => h.includes('title'));
    const quantityIndex = headers.findIndex(h => h.includes('quantity'));
    const pointsIndex = headers.findIndex(h => h.includes('points'));
    const publisherIndex = headers.findIndex(h => h.includes('publisher'));
    const isBBTIndex = headers.findIndex(h => h.includes('isbbt') || h.includes('is_bbt'));

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
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

  const toggleReportExpand = (key: string) => {
    setExpandedReports(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatUploadDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    } catch {
      return 'Unknown date';
    }
  };

  const guideSteps = [
    {
      title: "Select Report Period",
      description: "Choose the month and year for which you want to submit the book distribution report.",
      icon: "calendar-outline"
    },
    {
      title: "Add Books Manually",
      description: "Search for books from the library or enter new books manually. Enter quantity and points for each book.",
      icon: "book-outline"
    },
    {
      title: "Bulk Upload",
      description: "For multiple entries, download the template, fill it with your data, and upload the file.",
      icon: "cloud-upload-outline"
    },
    {
      title: "Submit Report",
      description: "Review your entries and submit the report. All submitted reports can be viewed in the history section.",
      icon: "checkmark-circle-outline"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>BBT Africa Connect</Text>
          <Text style={styles.headerSubText}>Hare Krishna Book Distribution</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => setShowGuide(true)}
          >
            <Ionicons name="help-circle-outline" size={24} color="#FF6B00" />
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Admin</Text>
          </View>
        </View>
      </View>

      <GuideOverlay
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        steps={guideSteps}
        screenName="Book Distribution Reports"
      />

      <ScrollView style={styles.content}>
        {/* Report Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Period</Text>
          
          <View style={styles.row}>
            <View style={styles.flex1}>
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
            
            <View style={styles.flex1}>
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
                <Text style={styles.text}>Loading books...</Text>
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
                      style={styles.switchButton}
                      onPress={() => {
                        setIsManualEntry(false);
                        setBookEntry(prev => ({ ...prev, title: '', bookId: undefined }));
                      }}
                    >
                      <Ionicons name="search" size={16} color="#4CAF50" />
                      <Text style={styles.switchText}>Search from book list instead</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                value={bookEntry.quantity.toString()}
                onChangeText={(text) => setBookEntry(prev => ({ ...prev, quantity: parseInt(text) || 1 }))}
                placeholder="Quantity"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.flex1}>
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

          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={[styles.checkbox, bookEntry.isBBTBook && styles.checkboxChecked]}
              onPress={() => setBookEntry(prev => ({ ...prev, isBBTBook: !prev.isBBTBook }))}
            >
              {bookEntry.isBBTBook && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </TouchableOpacity>
            <Text style={styles.text}>This is a BBT Book</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={addBookToReport}>
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
              <Text style={styles.text}>Total Books: {currentReportTotals.totalBooks}</Text>
              <Text style={styles.text}>Total Points: {currentReportTotals.totalPoints}</Text>
            </View>

            {currentReport.books.map((book, index) => (
              <View key={index} style={styles.bookItem}>
                <View style={styles.flex1}>
                  <Text style={styles.bookTitle}>
                    {book.title}
                    {book.bookId && <Text style={styles.bookIdBadge}> 📚</Text>}
                  </Text>
                  <Text style={styles.bookDetails}>
                    {book.bookId && <Text>ID: {book.bookId} | </Text>}
                    Qty: {book.quantity} | Points: {book.points} each | {book.publisher}
                  </Text>
                  <Text style={styles.bookType}>
                    {book.isBBTBook ? '🟢 BBT Book' : '🔵 Other Book'} | Total Points: {book.quantity * book.points}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeBookFromReport(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
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
          
          <TouchableOpacity style={styles.secondaryButton} onPress={downloadTemplate}>
            <Ionicons name="download-outline" size={20} color="#FF6B00" />
            <Text style={styles.secondaryButtonText}>Download Template</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.primaryButton, uploading && styles.buttonDisabled]}
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
          {loadingReports ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF8C42" />
              <Text style={styles.text}>Loading reports...</Text>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No reports uploaded yet</Text>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={fetchReports}
              >
                <Ionicons name="refresh-outline" size={20} color="#FF6B00" />
                <Text style={styles.secondaryButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            reports.map((report, index) => {
              const reportKey = report.id || `${report.month}-${report.year}-${index}`;
              const isExpanded = !!expandedReports[reportKey];
              return (
                <View key={reportKey} style={styles.reportCard}>
                  <TouchableOpacity
                    style={styles.reportHeader}
                    onPress={() => toggleReportExpand(reportKey)}
                  >
                    <Text style={styles.reportTitle}>
                      {report.month} {report.year}
                    </Text>
                    <Ionicons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={18} 
                      color="#FF6B00" 
                    />
                  </TouchableOpacity>
                  
                  <Text style={styles.reportStats}>
                    📚 Books: {report.totalBooks} | ⭐ Points: {report.totalPoints}
                  </Text>
                  
                  <Text style={styles.reportFile}>📄 {report.fileName}</Text>
                  
                  <Text style={styles.reportDetails}>
                    {report.books?.length || 0} unique titles • {formatUploadDate(report.uploadedAt)}
                  </Text>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {(report.books || []).map((book, bIndex) => (
                        <View key={`${reportKey}-${bIndex}`} style={styles.expandedBookItem}>
                          <Text style={styles.bookTitle}>
                            {book.title}
                            {book.bookId && <Text style={styles.bookIdBadge}> 📚</Text>}
                          </Text>
                          <Text style={styles.bookDetails}>
                            Qty: {book.quantity} | Points: {book.points} each
                          </Text>
                          <Text style={styles.bookType}>
                            {book.isBBTBook ? '🟢 BBT' : '🔵 Other'} • Total: {book.quantity * book.points} pts
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Base styles
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  flex1: { flex: 1 },
  row: { 
    flexDirection: 'row', 
    gap: 10 
  },
  
  // Header styles
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA',
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
  headerSubText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '300',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF6B00',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helpButton: {
    padding: 4,
  },
  
  // Content styles
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
  
  // Form styles
  inputGroup: { marginBottom: 20 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholder: { color: '#999' },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  picker: { height: 50 },
  
  // Loading styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  
  // Checkbox styles
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { backgroundColor: '#FFB380' },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
  },
  switchText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4CAF50',
  },
  
  // Text styles
  text: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  
  // Totals container
  totalsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF4E6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    padding: 12,
    marginBottom: 12,
  },
  
  // Book item styles
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
  bookType: {
    fontSize: 13,
    color: '#666',
  },
  bookIdBadge: { fontSize: 12 },
  
  // Modal styles
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
  
  // Search styles
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
  
  // Dropdown styles
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bookItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  
  // Empty state and manual entry
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
  
  // Report card styles
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 16,
    color: '#FF6B00',
    fontWeight: '500',
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
  reportDetails: {
    fontSize: 12,
    color: '#999',
  },
  
  // Expanded content styles
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  expandedBookItem: {
    backgroundColor: '#FFF9F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
});