import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
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
    setIsModalOpen(false);
    setSearchText('');
  };

  const handleManualEntry = () => {
    onBookSelect(null);
    setIsModalOpen(false);
    setSearchText('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSearchText('');
  };

  const renderBookItem = ({ item }: { item: Book }) => (
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
  );

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

  const handleGeneratePDFReport = async (reportType: 'summary' | 'detailed' = 'summary') => {
    console.log('Starting PDF report generation...', { reportType, reportsCount: reports.length });
    
    if (reports.length === 0) {
      Alert.alert('No Data', 'No reports available to generate statistics');
      return;
    }

    setGeneratingReport(true);
    try {
      console.log('Calling ReportGenerationService.generateAndSharePDF...');
      await ReportGenerationService.generateAndSharePDF(reports, reportType);
      console.log('PDF report generation completed successfully');
      Alert.alert(
        'Success', 
        'PDF report generated successfully! 📊\n\nIf the download didn\'t start automatically, check your browser\'s download folder or try right-clicking and "Save as..." on any download links.',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error('PDF report generation failed:', error);
      Alert.alert('Error', 'Failed to generate PDF report: ' + error.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateExcelReport = async () => {
    console.log('Starting Excel report generation...', { reportsCount: reports.length });
    
    if (reports.length === 0) {
      Alert.alert('No Data', 'No reports available to generate statistics');
      return;
    }

    setGeneratingReport(true);
    try {
      console.log('Calling ReportGenerationService.generateAndShareExcel...');
      await ReportGenerationService.generateAndShareExcel(reports);
      console.log('Excel report generation completed successfully');
      Alert.alert(
        'Success', 
        'Excel report generated successfully! 📈\n\nIf the download didn\'t start automatically, check your browser\'s download folder or try right-clicking and "Save as..." on any download links.',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error('Excel report generation failed:', error);
      Alert.alert('Error', 'Failed to generate Excel report: ' + error.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const showReportOptions = () => {
    if (reports.length === 0) {
      Alert.alert('No Data', 'No reports available to generate statistics');
      return;
    }
    setShowReportModal(true);
  };

  // Test function to debug report generation
  const testReportGeneration = async () => {
    console.log('=== TESTING REPORT GENERATION ===');
    console.log('Reports available:', reports.length);
    console.log('Reports data:', reports);
    
    if (reports.length === 0) {
      console.log('No reports available for testing');
      Alert.alert('Test Failed', 'No reports available for testing. Please add some book reports first.');
      return;
    }

    try {
      console.log('Testing statistics generation...');
      const stats = ReportGenerationService.generateStatistics(reports);
      console.log('Statistics test successful:', stats);
      
      Alert.alert('Test Success', `Statistics generated successfully!\n\nTotal Reports: ${stats.totalReports}\nTotal Books: ${stats.totalBooksDistributed}\nTotal Points: ${stats.totalPointsEarned}`);
    } catch (error: any) {
      console.error('Statistics test failed:', error);
      Alert.alert('Test Failed', 'Statistics generation failed: ' + error.message);
    }
  };

  // Manual download function for when automatic download fails
  const handleManualDownload = async (type: 'pdf' | 'excel', reportType: 'summary' | 'detailed' = 'summary') => {
    if (reports.length === 0) {
      Alert.alert('No Data', 'No reports available to generate statistics');
      return;
    }

    setGeneratingReport(true);
    try {
      let downloadUrl: string;
      let fileName: string;
      
      if (type === 'excel') {
        downloadUrl = await ReportGenerationService.generateExcelDownloadUrl(reports);
        fileName = `BBT_Book_Distribution_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else {
        downloadUrl = await ReportGenerationService.generatePDFDownloadUrl(reports, reportType);
        fileName = `BBT_Book_Distribution_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      }

      // Create a temporary link for manual download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Alert.alert(
        'Download Link Created', 
        `${type.toUpperCase()} report generated!\n\nIf the download didn't start, right-click the link and select "Save as..." or check your browser's download folder.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error(`${type} manual download failed:`, error);
      Alert.alert('Error', `Failed to generate ${type} report: ` + error.message);
    } finally {
      setGeneratingReport(false);
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
                    {book.bookId ? ' 📚' : ''}
                  </Text>
                  <Text style={styles.bookDetails}>
                    {book.bookId ? `ID: ${book.bookId} | ` : ''}Qty: {book.quantity} | Points: {book.points} each | {book.publisher}
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

        {/* Report Generation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generate Statistics Report</Text>
          <Text style={styles.description}>
            Generate comprehensive PDF or Excel reports with detailed statistics from all your book distribution data.
          </Text>
          
          {statistics && (
            <View style={styles.statsPreview}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{statistics.totalReports}</Text>
                <Text style={styles.statLabel}>Total Reports</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{statistics.totalBooksDistributed.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Books Distributed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{statistics.totalPointsEarned.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Points Earned</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{statistics.bbtVsOtherBooks.bbtPercentage.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>BBT Books</Text>
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

          {/* Debug Test Button */}
          <TouchableOpacity
            style={[styles.secondaryButton, { marginTop: 12 }]}
            onPress={testReportGeneration}
          >
            <Ionicons name="bug-outline" size={20} color="#FF6B00" />
            <Text style={styles.secondaryButtonText}>Test Report Generation</Text>
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
                            {book.bookId ? ' 📚' : ''}
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

      {/* Report Generation Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReportModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowReportModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Generate Report</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.reportOptionsContainer}>
              <Text style={styles.reportOptionsTitle}>Choose Report Format</Text>
              <Text style={styles.reportOptionsDescription}>
                Select the format for your comprehensive statistics report
              </Text>

              {/* PDF Options */}
              <View style={styles.reportOptionCard}>
                <View style={styles.reportOptionHeader}>
                  <Ionicons name="document-text-outline" size={24} color="#FF6B00" />
                  <Text style={styles.reportOptionTitle}>PDF Report</Text>
                </View>
                <Text style={styles.reportOptionDescription}>
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
                
                <View style={styles.reportOptionButtons}>
                  <TouchableOpacity
                    style={[styles.reportOptionButton, styles.manualButton]}
                    onPress={() => {
                      setShowReportModal(false);
                      handleManualDownload('pdf', 'summary');
                    }}
                    disabled={generatingReport}
                  >
                    <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.reportOptionButtonText}>Manual PDF Download</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Excel Option */}
              <View style={styles.reportOptionCard}>
                <View style={styles.reportOptionHeader}>
                  <Ionicons name="grid-outline" size={24} color="#4CAF50" />
                  <Text style={styles.reportOptionTitle}>Excel Report</Text>
                </View>
                <Text style={styles.reportOptionDescription}>
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
                
                <TouchableOpacity
                  style={[styles.reportOptionButton, styles.manualButton]}
                  onPress={() => {
                    setShowReportModal(false);
                    handleManualDownload('excel');
                  }}
                  disabled={generatingReport}
                >
                  <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.reportOptionButtonText}>Manual Excel Download</Text>
                </TouchableOpacity>
              </View>

              {/* Report Features */}
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Report Includes:</Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>Executive Summary with Key Metrics</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>Top Publishers Analysis</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>Monthly Distribution Breakdown</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>Top Distributed Books</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>BBT vs Other Books Analysis</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>Year-over-Year Comparison</Text>
                  </View>
                </View>
              </View>
            </View>
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
  manualButton: {
    backgroundColor: '#9C27B0',
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
});