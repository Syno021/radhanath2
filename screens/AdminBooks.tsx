import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import GuideOverlay from '../components/GuideOverlay';
import { auth, db } from "../firebaseCo";
import { useColorScheme } from '../hooks/useColorScheme';
import { useThemeColor } from '../hooks/useThemeColor';
import { ReportGenerationService, ReportStatistics } from '../services/ReportGenerationService';

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

// Mobile-Optimized Book Selection Modal Component
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredBooks = useMemo(() => {
    if (searchText.trim() === '') {
      return books;
    }
    return books.filter(book =>
      book.title.toLowerCase().includes(searchText.toLowerCase()) ||
      book.author.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, books]);

  const handleBookSelect = useCallback((book: Book) => {
    onBookSelect(book);
    setIsModalOpen(false);
    setSearchText('');
  }, [onBookSelect]);

  const handleManualEntry = useCallback(() => {
    onBookSelect(null);
    setIsModalOpen(false);
    setSearchText('');
  }, [onBookSelect]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSearchText('');
  }, []);

  const renderBookItem = useCallback(({ item }: { item: Book }) => (
    <TouchableOpacity 
      style={styles.mobileBookItem} 
      onPress={() => handleBookSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.bookItemContent}>
        <View style={styles.bookItemHeader}>
          <Text style={styles.mobileBookTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.bookId && (
            <View style={styles.libraryBadge}>
              <Text style={styles.libraryBadgeText}>📚</Text>
            </View>
          )}
        </View>
        <Text style={styles.mobileBookAuthor} numberOfLines={1}>
          by {item.author}
        </Text>
        {item.category && (
          <Text style={styles.mobileBookCategory} numberOfLines={1}>
            {item.category}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  ), [handleBookSelect]);

  return (
    <View>
      <TouchableOpacity 
        style={styles.mobileInputButton} 
        onPress={() => setIsModalOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.inputButtonContent}>
          <Ionicons name="book-outline" size={20} color="#FF6B00" />
          <Text style={[styles.inputButtonText, !selectedBook && styles.placeholder]}>
            {selectedBook ? selectedBook.title : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={isModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.mobileModalContainer}>
          {/* Header */}
          <View style={styles.mobileModalHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleCloseModal}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.mobileModalTitle}>Select Book</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Search Bar */}
          <View style={styles.mobileSearchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.mobileSearchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by title or author..."
              placeholderTextColor="#999"
              autoFocus={true}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchText('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Books List */}
          <FlatList
            data={filteredBooks}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id}
            style={styles.mobileBooksList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.mobileEmptyContainer}>
                <Ionicons name="book-outline" size={48} color="#CCC" />
                <Text style={styles.mobileEmptyTitle}>No books found</Text>
                <Text style={styles.mobileEmptySubtitle}>
                  {searchText ? 'Try a different search term' : 'No books available'}
                </Text>
                {allowManualEntry && (
                  <TouchableOpacity 
                    style={styles.mobileManualButton} 
                    onPress={handleManualEntry}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
                    <Text style={styles.mobileManualText}>Enter manually</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            ListFooterComponent={
              allowManualEntry && filteredBooks.length > 0 ? (
                <TouchableOpacity 
                  style={styles.mobileManualButton} 
                  onPress={handleManualEntry}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
                  <Text style={styles.mobileManualText}>Enter book title manually</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </SafeAreaView>
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  
  // Custom theme colors for the app
  const primaryColor = '#FF6B00';
  const primaryLight = isDark ? '#FF8C42' : '#FF6B00';
  const cardBackground = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDark ? '#3A3A3C' : '#E0E0E0';
  const secondaryBackground = isDark ? '#2C2C2E' : '#FDFCFA';
  const mutedText = isDark ? '#8E8E93' : '#666666';
  const placeholderText = isDark ? '#6D6D70' : '#999999';
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [showGuide, setShowGuide] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFullReportModal, setShowFullReportModal] = useState(false);
  const [selectedFullReport, setSelectedFullReport] = useState<MonthlyReport | null>(null);
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);
  
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
    if (reports.length > 0) {
      const stats = ReportGenerationService.generateStatistics(reports);
      setStatistics(stats);
    }
  }, [reports]);

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

  const fetchBooks = useCallback(async () => {
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
  }, []);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const reportsRef = collection(db, 'bookReports');
      const querySnapshot = await getDocs(reportsRef);
      
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

      setReports(allReports);
      
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to fetch reports: ' + error.message);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  const handleBookSelect = useCallback((book: Book | null) => {
    if (book) {
      setSelectedBook(book);
      setIsManualEntry(false);
      const isBBT = book.title.toLowerCase().includes('bhagavad') || 
                   book.title.toLowerCase().includes('bhagavatam') || 
                   book.title.toLowerCase().includes('caitanya');
      setBookEntry(prev => ({
        ...prev,
        bookId: book.id,
        title: book.title,
        publisher: isBBT ? 'BBT' : prev.publisher,
        isBBTBook: isBBT
      }));
    } else {
      setSelectedBook(null);
      setIsManualEntry(true);
      setBookEntry(prev => ({ ...prev, bookId: undefined, title: '' }));
    }
  }, []);

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

  const calculateReportTotals = useCallback((books: BookEntry[]) => {
    const totalBooks = books.reduce((sum, book) => sum + book.quantity, 0);
    const totalPoints = books.reduce((sum, book) => sum + (book.quantity * book.points), 0);
    return { totalBooks, totalPoints };
  }, []);

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

  const currentReportTotals = useMemo(() => 
    calculateReportTotals(currentReport.books || []), 
    [currentReport.books, calculateReportTotals]
  );

  const toggleReportExpand = useCallback((key: string) => {
    setExpandedReports(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const formatUploadDate = useCallback((timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    } catch {
      return 'Unknown date';
    }
  }, []);

  const handleGeneratePDFReport = useCallback(async (reportType: 'summary' | 'detailed' = 'summary') => {
    if (reports.length === 0) {
      Alert.alert('No Data', 'No reports available to generate statistics');
      return;
    }

    setGeneratingReport(true);
    try {
      await ReportGenerationService.generateAndSharePDF(reports, reportType);
      Alert.alert(
        'Success', 
        'PDF report generated successfully! 📊',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error('PDF report generation failed:', error);
      Alert.alert('Error', 'Failed to generate PDF report: ' + error.message);
    } finally {
      setGeneratingReport(false);
    }
  }, [reports]);

  const handleGenerateExcelReport = useCallback(async () => {
    if (reports.length === 0) {
      Alert.alert('No Data', 'No reports available to generate statistics');
      return;
    }

    setGeneratingReport(true);
    try {
      await ReportGenerationService.generateAndShareExcel(reports);
      Alert.alert(
        'Success', 
        'Excel report generated successfully! 📈',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error('Excel report generation failed:', error);
      Alert.alert('Error', 'Failed to generate Excel report: ' + error.message);
    } finally {
      setGeneratingReport(false);
    }
  }, [reports]);

  const showReportOptions = useCallback(() => {
    if (reports.length === 0) {
      Alert.alert('No Data', 'No reports available to generate statistics');
      return;
    }
    setShowReportModal(true);
  }, [reports.length]);

  const viewFullReport = useCallback((report: MonthlyReport) => {
    setSelectedFullReport(report);
    setShowFullReportModal(true);
  }, []);



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

  // Generate theme-aware styles
  const themeStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: secondaryBackground,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: secondaryBackground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerText: {
      fontSize: 22,
      fontWeight: '600',
      color: primaryColor,
      letterSpacing: 0.5,
    },
    headerSubText: {
      fontSize: 12,
      color: mutedText,
      fontWeight: '300',
      marginTop: 2,
    },
    section: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      elevation: 2,
      shadowColor: isDark ? '#000' : primaryColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '400',
      color: textColor,
      marginBottom: 20,
      letterSpacing: 0.3,
    },
    label: {
      fontSize: 16,
      marginBottom: 8,
      color: textColor,
    },
    input: {
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: cardBackground,
      color: textColor,
    },
    text: {
      fontSize: 14,
      color: textColor,
      marginLeft: 10,
    },
    description: {
      fontSize: 14,
      color: mutedText,
      marginBottom: 20,
      lineHeight: 20,
    },
    reportCard: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#FFE4CC',
      shadowColor: isDark ? '#000' : primaryColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    reportTitle: {
      fontSize: 16,
      color: primaryColor,
      fontWeight: '500',
    },
    reportStats: {
      fontSize: 14,
      color: mutedText,
      marginBottom: 4,
    },
    reportFile: {
      fontSize: 12,
      color: placeholderText,
      marginBottom: 4,
    },
    reportDetails: {
      fontSize: 12,
      color: placeholderText,
    },
    bookItem: {
      backgroundColor: isDark ? '#2C2C2E' : '#FFF9F5',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#FFE4CC',
      flexDirection: 'row',
    },
    bookTitle: {
      fontSize: 16,
      color: textColor,
      fontWeight: '500',
      marginBottom: 4,
    },
    bookDetails: {
      fontSize: 14,
      color: mutedText,
      marginBottom: 2,
    },
    bookType: {
      fontSize: 13,
      color: mutedText,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: secondaryBackground,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: textColor,
    },
    modalContent: {
      flex: 1,
      padding: 20,
    },
    fullReportContainer: {
      padding: 20,
    },
    fullReportHeader: {
      backgroundColor: isDark ? '#2C2C2E' : '#FFF4E6',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#FFE4CC',
    },
    fullReportTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: primaryColor,
      marginBottom: 8,
    },
    fullReportSubtitle: {
      fontSize: 14,
      color: mutedText,
      marginBottom: 4,
    },
    fullReportDate: {
      fontSize: 12,
      color: placeholderText,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: borderColor,
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    summaryNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: primaryColor,
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: 12,
      color: mutedText,
      textAlign: 'center',
    },
    fullReportBookItem: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: borderColor,
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    fullReportBookTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      flex: 1,
      marginRight: 12,
      lineHeight: 22,
    },
    fullReportBookDetailText: {
      marginLeft: 6,
      fontSize: 14,
      color: mutedText,
    },
    fullReportBookTotalText: {
      fontSize: 14,
      fontWeight: '600',
      color: primaryColor,
    },
  });

  return (
    <SafeAreaView style={themeStyles.container}>
      <View style={themeStyles.header}>
        <View>
          <Text style={themeStyles.headerText}>BBT Africa Connect</Text>
          <Text style={themeStyles.headerSubText}>Hare Krishna Book Distribution</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => setShowGuide(true)}
          >
            <Ionicons name="help-circle-outline" size={24} color={primaryColor} />
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
        <View style={themeStyles.section}>
          <Text style={themeStyles.sectionTitle}>Report Period</Text>
          
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={themeStyles.label}>Month</Text>
              <View style={[styles.pickerContainer, { borderColor: borderColor, backgroundColor: cardBackground }]}>
                <Picker
                  selectedValue={currentReport.month}
                  onValueChange={(value) => setCurrentReport(prev => ({ ...prev, month: value }))}
                  style={[styles.picker, { color: textColor }]}
                >
                  {MONTHS.map(month => (
                    <Picker.Item key={month} label={month} value={month} color={textColor} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.flex1}>
              <Text style={themeStyles.label}>Year</Text>
              <View style={[styles.pickerContainer, { borderColor: borderColor, backgroundColor: cardBackground }]}>
                <Picker
                  selectedValue={currentReport.year}
                  onValueChange={(value) => setCurrentReport(prev => ({ ...prev, year: value }))}
                  style={[styles.picker, { color: textColor }]}
                >
                  {YEARS.map(year => (
                    <Picker.Item key={year} label={year.toString()} value={year} color={textColor} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Manual Book Entry */}
        <View style={themeStyles.section}>
          <Text style={themeStyles.sectionTitle}>Add Books Manually</Text>

          <View style={styles.inputGroup}>
            <Text style={themeStyles.label}>Book Title *</Text>
            {loadingBooks ? (
              <View style={[styles.loadingContainer, { borderColor: borderColor, backgroundColor: isDark ? '#2C2C2E' : '#F9F9F9' }]}>
                <ActivityIndicator size="small" color={primaryLight} />
                <Text style={themeStyles.text}>Loading books...</Text>
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
                      style={[themeStyles.input, { color: textColor }]}
                      value={bookEntry.title}
                      onChangeText={(text) => setBookEntry(prev => ({ ...prev, title: text }))}
                      placeholder="Enter book title manually"
                      placeholderTextColor={placeholderText}
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
              <Text style={themeStyles.label}>Quantity *</Text>
              <TextInput
                style={[themeStyles.input, { color: textColor }]}
                value={bookEntry.quantity.toString()}
                onChangeText={(text) => setBookEntry(prev => ({ ...prev, quantity: parseInt(text) || 1 }))}
                placeholder="Quantity"
                placeholderTextColor={placeholderText}
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.flex1}>
              <Text style={themeStyles.label}>Points per Book *</Text>
              <TextInput
                style={[themeStyles.input, { color: textColor }]}
                value={bookEntry.points.toString()}
                onChangeText={(text) => setBookEntry(prev => ({ ...prev, points: parseInt(text) || 5 }))}
                placeholder="Points"
                placeholderTextColor={placeholderText}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={themeStyles.label}>Publisher</Text>
            <TextInput
              style={[themeStyles.input, { color: textColor }]}
              value={bookEntry.publisher}
              onChangeText={(text) => setBookEntry(prev => ({ ...prev, publisher: text }))}
              placeholder="Publisher name"
              placeholderTextColor={placeholderText}
            />
          </View>

          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={[styles.checkbox, { borderColor: borderColor }, bookEntry.isBBTBook && styles.checkboxChecked]}
              onPress={() => setBookEntry(prev => ({ ...prev, isBBTBook: !prev.isBBTBook }))}
            >
              {bookEntry.isBBTBook && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </TouchableOpacity>
            <Text style={themeStyles.text}>This is a BBT Book</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={addBookToReport}>
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Add to Report</Text>
          </TouchableOpacity>
        </View>

        {/* Current Report Books */}
        {currentReport.books && currentReport.books.length > 0 && (
          <View style={themeStyles.section}>
            <Text style={themeStyles.sectionTitle}>
              Current Report ({currentReport.books.length} books)
            </Text>
            <View style={[styles.totalsContainer, { backgroundColor: isDark ? '#2C2C2E' : '#FFF4E6', borderColor: isDark ? '#3A3A3C' : '#FFE4CC' }]}>
              <Text style={themeStyles.text}>Total Books: {currentReportTotals.totalBooks}</Text>
              <Text style={themeStyles.text}>Total Points: {currentReportTotals.totalPoints}</Text>
            </View>

            {currentReport.books.map((book, index) => (
              <View key={index} style={themeStyles.bookItem}>
                <View style={styles.flex1}>
                  <Text style={themeStyles.bookTitle}>
                    {book.title}
                    {book.bookId ? ' 📚' : ''}
                  </Text>
                  <Text style={themeStyles.bookDetails}>
                    {book.bookId ? `ID: ${book.bookId} | ` : ''}Qty: {book.quantity} | Points: {book.points} each | {book.publisher}
                  </Text>
                  <Text style={themeStyles.bookType}>
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
        <View style={themeStyles.section}>
          <Text style={themeStyles.sectionTitle}>Bulk Upload</Text>
          <Text style={themeStyles.description}>
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

        {/* Report Generation */}
        <View style={themeStyles.section}>
          <Text style={themeStyles.sectionTitle}>Generate Statistics Report</Text>
          <Text style={themeStyles.description}>
            Generate comprehensive PDF or Excel reports with detailed statistics from all your book distribution data.
          </Text>
          
          {statistics && (
            <View style={[styles.statsPreview, { backgroundColor: isDark ? '#2C2C2E' : '#FFF4E6', borderColor: isDark ? '#3A3A3C' : '#FFE4CC' }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: primaryColor }]}>{statistics.totalReports}</Text>
                <Text style={[styles.statLabel, { color: mutedText }]}>Total Reports</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: primaryColor }]}>{statistics.totalBooksDistributed.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: mutedText }]}>Books Distributed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: primaryColor }]}>{statistics.totalPointsEarned.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: mutedText }]}>Points Earned</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: primaryColor }]}>{statistics.bbtVsOtherBooks.bbtPercentage.toFixed(1)}%</Text>
                <Text style={[styles.statLabel, { color: mutedText }]}>BBT Books</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, generatingReport && styles.buttonDisabled]}
            onPress={showReportOptions}
            disabled={generatingReport}
          >
            {generatingReport ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="analytics-outline" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Generate Report</Text>
              </>
            )}
          </TouchableOpacity>

        </View>

        {/* Reports History */}
        <View style={themeStyles.section}>
          <Text style={themeStyles.sectionTitle}>Reports History ({reports.length})</Text>
          {loadingReports ? (
            <View style={[styles.loadingContainer, { borderColor: borderColor, backgroundColor: isDark ? '#2C2C2E' : '#F9F9F9' }]}>
              <ActivityIndicator size="small" color={primaryLight} />
              <Text style={themeStyles.text}>Loading reports...</Text>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: mutedText }]}>No reports uploaded yet</Text>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={fetchReports}
              >
                <Ionicons name="refresh-outline" size={20} color={primaryColor} />
                <Text style={styles.secondaryButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            reports.map((report, index) => {
              const reportKey = report.id || `${report.month}-${report.year}-${index}`;
              const isExpanded = !!expandedReports[reportKey];
              return (
                <View key={reportKey} style={themeStyles.reportCard}>
                  <TouchableOpacity
                    style={styles.reportHeader}
                    onPress={() => toggleReportExpand(reportKey)}
                  >
                    <Text style={themeStyles.reportTitle}>
                      {report.month} {report.year}
                    </Text>
                    <Ionicons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={18} 
                      color={primaryColor} 
                    />
                  </TouchableOpacity>
                  
                  <Text style={themeStyles.reportStats}>
                    📚 Books: {report.totalBooks} | ⭐ Points: {report.totalPoints}
                  </Text>
                  
                  <Text style={themeStyles.reportFile}>📄 {report.fileName}</Text>
                  
                  <Text style={themeStyles.reportDetails}>
                    {report.books?.length || 0} unique titles • {formatUploadDate(report.uploadedAt)}
                  </Text>

                  <TouchableOpacity
                    style={[styles.viewFullButton, { backgroundColor: isDark ? '#2C2C2E' : '#FFF4E6', borderColor: isDark ? '#3A3A3C' : '#FFE4CC' }]}
                    onPress={() => viewFullReport(report)}
                  >
                    <Ionicons name="eye-outline" size={16} color={primaryColor} />
                    <Text style={[styles.viewFullButtonText, { color: primaryColor }]}>View Full Report</Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {(report.books || []).map((book, bIndex) => (
                        <View key={`${reportKey}-${bIndex}`} style={[styles.expandedBookItem, { backgroundColor: isDark ? '#2C2C2E' : '#FFF9F5', borderColor: isDark ? '#3A3A3C' : '#FFE4CC' }]}>
                          <Text style={themeStyles.bookTitle}>
                            {book.title}
                            {book.bookId ? ' 📚' : ''}
                          </Text>
                          <Text style={themeStyles.bookDetails}>
                            Qty: {book.quantity} | Points: {book.points} each
                          </Text>
                          <Text style={themeStyles.bookType}>
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

      {/* Report Generation Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReportModal(false)}
      >
        <SafeAreaView style={themeStyles.modalContainer}>
          <View style={themeStyles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowReportModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={themeStyles.modalTitle}>Generate Report</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={themeStyles.modalContent}>
            <View style={styles.reportOptionsContainer}>
              <Text style={[styles.reportOptionsTitle, { color: textColor }]}>Choose Report Format</Text>
              <Text style={[styles.reportOptionsDescription, { color: mutedText }]}>
                Select the format for your comprehensive statistics report
              </Text>

              {/* PDF Options */}
              <View style={[styles.reportOptionCard, { backgroundColor: cardBackground, borderColor: borderColor }]}>
                <View style={styles.reportOptionHeader}>
                  <Ionicons name="document-text-outline" size={24} color={primaryColor} />
                  <Text style={[styles.reportOptionTitle, { color: textColor }]}>PDF Report</Text>
                </View>
                <Text style={[styles.reportOptionDescription, { color: mutedText }]}>
                  Professional PDF with charts, tables, and executive summary
                </Text>
                
                <View style={styles.reportOptionButtons}>
                  <TouchableOpacity
                    style={[styles.reportOptionButton, styles.summaryButton]}
                    onPress={() => {
                      setShowReportModal(false);
                      handleGeneratePDFReport('summary');
                    }}
                    disabled={generatingReport}
                  >
                    <Ionicons name="analytics-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.reportOptionButtonText}>Summary Report</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.reportOptionButton, styles.detailedButton]}
                    onPress={() => {
                      setShowReportModal(false);
                      handleGeneratePDFReport('detailed');
                    }}
                    disabled={generatingReport}
                  >
                    <Ionicons name="list-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.reportOptionButtonText}>Detailed Report</Text>
                  </TouchableOpacity>
                </View>
                
              </View>

              {/* Excel Option */}
              <View style={[styles.reportOptionCard, { backgroundColor: cardBackground, borderColor: borderColor }]}>
                <View style={styles.reportOptionHeader}>
                  <Ionicons name="grid-outline" size={24} color="#4CAF50" />
                  <Text style={[styles.reportOptionTitle, { color: textColor }]}>Excel Report</Text>
                </View>
                <Text style={[styles.reportOptionDescription, { color: mutedText }]}>
                  Comprehensive spreadsheet with multiple sheets for detailed analysis
                </Text>
                
                <TouchableOpacity
                  style={[styles.reportOptionButton, styles.excelButton]}
                  onPress={() => {
                    setShowReportModal(false);
                    handleGenerateExcelReport();
                  }}
                  disabled={generatingReport}
                >
                  <Ionicons name="grid-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.reportOptionButtonText}>Generate Excel Report</Text>
                </TouchableOpacity>
                
              </View>

              {/* Report Features */}
              <View style={[styles.featuresContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA' }]}>
                <Text style={[styles.featuresTitle, { color: textColor }]}>Report Includes:</Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={[styles.featureText, { color: mutedText }]}>Executive Summary with Key Metrics</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={[styles.featureText, { color: mutedText }]}>Top Publishers Analysis</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={[styles.featureText, { color: mutedText }]}>Monthly Distribution Breakdown</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={[styles.featureText, { color: mutedText }]}>Top Distributed Books</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={[styles.featureText, { color: mutedText }]}>BBT vs Other Books Analysis</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={[styles.featureText, { color: mutedText }]}>Year-over-Year Comparison</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Full Report View Modal */}
      <Modal
        visible={showFullReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFullReportModal(false)}
      >
        <SafeAreaView style={themeStyles.modalContainer}>
          <View style={themeStyles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowFullReportModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={themeStyles.modalTitle}>
              {selectedFullReport ? `${selectedFullReport.month} ${selectedFullReport.year}` : 'Full Report'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={themeStyles.modalContent}>
            {selectedFullReport && (
              <View style={themeStyles.fullReportContainer}>
                {/* Report Header */}
                <View style={themeStyles.fullReportHeader}>
                  <Text style={themeStyles.fullReportTitle}>
                    {selectedFullReport.month} {selectedFullReport.year} Report
                  </Text>
                  <Text style={themeStyles.fullReportSubtitle}>
                    📄 {selectedFullReport.fileName}
                  </Text>
                  <Text style={themeStyles.fullReportDate}>
                    Uploaded: {formatUploadDate(selectedFullReport.uploadedAt)}
                  </Text>
                </View>

                {/* Report Summary */}
                <View style={styles.fullReportSummary}>
                  <View style={themeStyles.summaryCard}>
                    <Text style={themeStyles.summaryNumber}>{selectedFullReport.totalBooks}</Text>
                    <Text style={themeStyles.summaryLabel}>Total Books</Text>
                  </View>
                  <View style={themeStyles.summaryCard}>
                    <Text style={themeStyles.summaryNumber}>{selectedFullReport.totalPoints}</Text>
                    <Text style={themeStyles.summaryLabel}>Total Points</Text>
                  </View>
                  <View style={themeStyles.summaryCard}>
                    <Text style={themeStyles.summaryNumber}>{selectedFullReport.books?.length || 0}</Text>
                    <Text style={themeStyles.summaryLabel}>Unique Titles</Text>
                  </View>
                </View>

                {/* Books List */}
                <View style={styles.fullReportBooks}>
                  <Text style={[styles.fullReportSectionTitle, { color: textColor }]}>Books Distributed</Text>
                  {(selectedFullReport.books || []).map((book, index) => (
                    <View key={index} style={themeStyles.fullReportBookItem}>
                      <View style={styles.fullReportBookHeader}>
                        <Text style={themeStyles.fullReportBookTitle}>
                          {book.title}
                          {book.bookId && ' 📚'}
                        </Text>
                        <View style={[
                          styles.fullReportBookType,
                          { backgroundColor: book.isBBTBook ? '#E8F5E8' : '#E3F2FD' }
                        ]}>
                          <Text style={[
                            styles.fullReportBookTypeText,
                            { color: book.isBBTBook ? '#2E7D32' : '#1976D2' }
                          ]}>
                            {book.isBBTBook ? 'BBT' : 'Other'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.fullReportBookDetails}>
                        <View style={styles.fullReportBookDetail}>
                          <Ionicons name="library-outline" size={16} color={mutedText} />
                          <Text style={themeStyles.fullReportBookDetailText}>
                            Quantity: {book.quantity}
                          </Text>
                        </View>
                        <View style={styles.fullReportBookDetail}>
                          <Ionicons name="star-outline" size={16} color={mutedText} />
                          <Text style={themeStyles.fullReportBookDetailText}>
                            Points: {book.points} each
                          </Text>
                        </View>
                        <View style={styles.fullReportBookDetail}>
                          <Ionicons name="business-outline" size={16} color={mutedText} />
                          <Text style={themeStyles.fullReportBookDetailText}>
                            {book.publisher}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.fullReportBookTotal}>
                        <Text style={themeStyles.fullReportBookTotalText}>
                          Total Points: {book.quantity * book.points}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  
  // Mobile-optimized input button
  mobileInputButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  inputButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inputButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },

  // Mobile modal styles
  mobileModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  mobileModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 32,
  },

  // Mobile search styles
  mobileSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
  },
  mobileSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    marginRight: 8,
  },
  mobileBooksList: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Mobile book item styles
  mobileBookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  bookItemContent: {
    flex: 1,
  },
  bookItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  mobileBookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  libraryBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFF4E6',
    borderRadius: 4,
  },
  libraryBadgeText: {
    fontSize: 12,
  },
  mobileBookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  mobileBookCategory: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },

  // Mobile empty state and manual entry
  mobileEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  mobileEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  mobileEmptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  mobileManualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginVertical: 8,
  },
  mobileManualText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },

  // Legacy styles (keeping for backward compatibility)
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

  // Report Generation Styles
  statsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Report Options Styles
  reportOptionsContainer: {
    flex: 1,
  },
  reportOptionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reportOptionsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  reportOptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  reportOptionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  reportOptionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  reportOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  summaryButton: {
    backgroundColor: '#FF6B00',
  },
  detailedButton: {
    backgroundColor: '#FF8C42',
  },
  excelButton: {
    backgroundColor: '#4CAF50',
  },
  reportOptionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Features Styles
  featuresContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },

  // Full Report View Styles
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF4E6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    marginTop: 8,
  },
  viewFullButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
  },

  // Full Report Modal Styles
  fullReportContainer: {
    padding: 20,
  },
  fullReportHeader: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  fullReportTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF6B00',
    marginBottom: 8,
  },
  fullReportSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fullReportDate: {
    fontSize: 12,
    color: '#999',
  },

  // Summary Cards
  fullReportSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Books Section
  fullReportBooks: {
    marginBottom: 20,
  },
  fullReportSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  fullReportBookItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fullReportBookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fullReportBookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  fullReportBookType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fullReportBookTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fullReportBookDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  fullReportBookDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '30%',
  },
  fullReportBookDetailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  fullReportBookTotal: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  fullReportBookTotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B00',
  },
});