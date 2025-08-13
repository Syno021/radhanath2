import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebaseCo";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc,
  query,
  where,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import DocumentPicker from 'react-native-document-picker';
import XLSX from 'xlsx';

interface BookEntry {
  title: string;
  isbn?: string;
  quantity: number;
  points: number;
  totalPoints: number;
  publisher: string;
  isBBTBook: boolean;
}

interface MonthlyReport {
  id?: string;
  month: string;
  year: number;
  totalBooks: number;
  totalBBTBooks: number;
  totalPoints: number;
  books: BookEntry[];
  uploadedBy: string;
  uploadedAt: any;
  fileName: string;
}

export default function AdminBooks() {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [uploadedData, setUploadedData] = useState<BookEntry[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  // BBT Book markers and point values
  const BBT_PUBLISHERS = ['BBT', 'Bhaktivedanta Book Trust', 'BBT International'];
  const BBT_BOOK_POINTS: { [key: string]: number } = {
    'Bhagavad-gita As It Is': 10,
    'Srimad-Bhagavatam': 15,
    'Sri Caitanya-caritamrta': 12,
    'The Nectar of Devotion': 8,
    'Krishna Book': 10,
    'Science of Self-Realization': 6,
    'Perfect Questions Perfect Answers': 4,
    'Easy Journey to Other Planets': 3,
    'Teachings of Lord Caitanya': 7,
    'Sri Isopanisad': 3,
    // Add more books and their point values as needed
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkUserAuthorization(currentUser.uid);
      } else {
        setIsAuthorized(false);
        // Navigate to login if navigation is available
        if (navigation && typeof navigation.navigate === 'function') {
          navigation.navigate("Login" as never);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchMonthlyReports();
    }
  }, [isAuthorized]);

  const checkUserAuthorization = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Check if user has admin role or is part of core national team
        const authorizedRoles = ['admin', 'core_team', 'national_coordinator'];
        if (authorizedRoles.includes(userData.role)) {
          setIsAuthorized(true);
        } else {
          Alert.alert(
            "Access Denied", 
            "You don't have permission to access this feature. This is restricted to core national team members."
          );
          if (navigation && typeof navigation.goBack === 'function') {
            navigation.goBack();
          }
        }
      }
    } catch (error) {
      console.error("Authorization check error:", error);
      Alert.alert("Error", "Failed to verify authorization");
      if (navigation && typeof navigation.goBack === 'function') {
        navigation.goBack();
      }
    }
  };

  const fetchMonthlyReports = async () => {
    try {
      const reportsQuery = query(
        collection(db, "monthlyBookReports"),
        where("uploadedBy", "==", user?.uid || "")
      );
      const querySnapshot = await getDocs(reportsQuery);
      const reports: MonthlyReport[] = [];
      
      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() } as MonthlyReport);
      });
      
      // Sort by year and month (most recent first)
      reports.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return new Date(b.month).getMonth() - new Date(a.month).getMonth();
      });
      
      setMonthlyReports(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const selectDocument = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Document picking is not supported on web platform');
      return;
    }

    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.xlsx, DocumentPicker.types.xls],
      });
      
      setSelectedFile(result);
      Alert.alert(
        "File Selected", 
        `${result.name} is ready to be processed.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Process File", onPress: () => processExcelFile(result) }
        ]
      );
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log("User cancelled document picker");
      } else {
        Alert.alert("Error", "Failed to select document");
        console.error("Document picker error:", error);
      }
    }
  };

  const processExcelFile = async (file: any) => {
    setLoading(true);
    try {
      // Read the Excel file
      const data = await XLSX.readFile(file.uri);
      const worksheet = data.Sheets[data.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const processedBooks: BookEntry[] = [];
      let totalPoints = 0;
      let totalBBTBooks = 0;

      jsonData.forEach((row: any) => {
        const title = row['Book Title'] || row['Title'] || row['Book'] || '';
        const quantity = parseInt(row['Quantity'] || row['Qty'] || '0');
        const publisher = row['Publisher'] || '';
        
        // Check if it's a BBT book
        const isBBTBook = BBT_PUBLISHERS.some(pub => 
          publisher.toLowerCase().includes(pub.toLowerCase())
        ) || BBT_BOOK_POINTS.hasOwnProperty(title);

        // Calculate points
        let points = 0;
        if (isBBTBook) {
          points = BBT_BOOK_POINTS[title] || 1; // Default 1 point for BBT books not in list
          totalBBTBooks += quantity;
        }

        const totalBookPoints = points * quantity;
        totalPoints += totalBookPoints;

        if (title && quantity > 0) {
          processedBooks.push({
            title,
            isbn: row['ISBN'] || '',
            quantity,
            points,
            totalPoints: totalBookPoints,
            publisher,
            isBBTBook
          });
        }
      });

      setUploadedData(processedBooks);
      
      Alert.alert(
        "File Processed Successfully",
        `Found ${processedBooks.length} books\nTotal BBT Books: ${totalBBTBooks}\nTotal Points: ${totalPoints}`,
        [
          { text: "Review Data", onPress: () => {} },
          { text: "Save to Database", onPress: () => saveMonthlyReport(processedBooks, file.name) }
        ]
      );

    } catch (error) {
      console.error("Excel processing error:", error);
      Alert.alert("Error", "Failed to process Excel file. Please check the file format.");
    } finally {
      setLoading(false);
    }
  };

  const saveMonthlyReport = async (books: BookEntry[], fileName: string) => {
    setLoading(true);
    try {
      const currentDate = new Date();
      const monthlyReport: Omit<MonthlyReport, 'id'> = {
        month: currentDate.toLocaleString('default', { month: 'long' }),
        year: currentDate.getFullYear(),
        totalBooks: books.reduce((sum, book) => sum + book.quantity, 0),
        totalBBTBooks: books.filter(book => book.isBBTBook).reduce((sum, book) => sum + book.quantity, 0),
        totalPoints: books.reduce((sum, book) => sum + book.totalPoints, 0),
        books,
        uploadedBy: user?.uid || '',
        uploadedAt: serverTimestamp(),
        fileName
      };

      await addDoc(collection(db, "monthlyBookReports"), monthlyReport);
      
      Alert.alert("Success", "Monthly book report saved successfully!");
      setUploadedData([]);
      setSelectedFile(null);
      fetchMonthlyReports();
      
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save monthly report");
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (reportId: string) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this monthly report?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "monthlyBookReports", reportId));
              Alert.alert("Success", "Report deleted successfully");
              fetchMonthlyReports();
            } catch (error) {
              Alert.alert("Error", "Failed to delete report");
            }
          }
        }
      ]
    );
  };

  if (!isAuthorized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C42" />
          <Text style={styles.loadingText}>Checking authorization...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="book-outline" size={32} color="#FF8C42" />
          <Text style={styles.headerText}>Monthly Book Points</Text>
        </View>
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text style={styles.description}>
            Upload Excel files to track BBT book distribution points and manage monthly reports.
          </Text>

          {/* Upload Section */}
          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Upload Monthly Report</Text>

            <TouchableOpacity
              style={[styles.uploadButton, loading && styles.uploadButtonDisabled]}
              onPress={selectDocument}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="cloud-upload-outline" 
                size={24} 
                color="#FFFFFF" 
                style={{ marginRight: 8 }}
              />
              <Text style={styles.uploadButtonText}>
                {loading ? "Processing..." : "Select Excel File"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.uploadHint}>
              Supported formats: .xlsx, .xls{'\n'}
              Required columns: Book Title, Quantity, Publisher
            </Text>
          </View>

          {/* Preview Data */}
          {uploadedData.length > 0 && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>
                Preview: {uploadedData.length} Books Found
              </Text>
              
              {uploadedData.slice(0, 5).map((book, index) => (
                <View key={index} style={[
                  styles.previewItem,
                  { borderLeftColor: book.isBBTBook ? '#FF8C42' : '#DDD' }
                ]}>
                  <Text style={styles.previewBookTitle}>{book.title}</Text>
                  <Text style={styles.previewBookDetails}>
                    Qty: {book.quantity} | Points: {book.totalPoints} | {book.isBBTBook ? 'BBT Book' : 'Other'}
                  </Text>
                </View>
              ))}
              
              {uploadedData.length > 5 && (
                <Text style={styles.previewMore}>
                  ... and {uploadedData.length - 5} more books
                </Text>
              )}
            </View>
          )}

          {/* Monthly Reports History */}
          <View style={styles.reportsSection}>
            <Text style={styles.sectionTitle}>Monthly Reports History</Text>

            {monthlyReports.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={48} color="#DDD" />
                <Text style={styles.emptyStateText}>
                  No monthly reports uploaded yet
                </Text>
              </View>
            ) : (
              monthlyReports.map((report) => (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportTitle}>
                        {report.month} {report.year}
                      </Text>
                      <Text style={styles.reportFileName}>
                        File: {report.fileName}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => deleteReport(report.id!)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.reportStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Total Books</Text>
                      <Text style={styles.statValue}>{report.totalBooks}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>BBT Books</Text>
                      <Text style={[styles.statValue, { color: '#FF8C42' }]}>{report.totalBBTBooks}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Total Points</Text>
                      <Text style={[styles.statValue, { color: '#FF8C42', fontWeight: 'bold' }]}>{report.totalPoints}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* BBT Books Info */}
          <View style={styles.quoteSection}>
            <Text style={styles.quote}>
              "Books are the basis; preach and read them."
            </Text>
            <Text style={styles.quoteAuthor}>
              - Srila Prabhupada
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  uploadSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#FF8C42',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadButtonDisabled: {
    backgroundColor: '#FFB380',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  previewSection: {
    backgroundColor: '#FFF9F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8C42',
    marginBottom: 16,
  },
  previewItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  previewBookTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  previewBookDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  previewMore: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  reportsSection: {
    marginBottom: 30,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF8C42',
    marginBottom: 4,
  },
  reportFileName: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FFE4E4',
    padding: 8,
    borderRadius: 6,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quoteSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  quote: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
});