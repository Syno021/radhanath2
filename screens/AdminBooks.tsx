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

// Conditional imports
let DocumentPicker: any = null;
if (Platform.OS !== 'web') {
  DocumentPicker = require('react-native-document-picker');
}

interface BookEntry {
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

export default function AdminBooks() {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [processedData, setProcessedData] = useState<BookEntry[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [XLSXRef, setXLSXRef] = useState<any>(null);

  // BBT Book points
  const BBT_PUBLISHERS = ['BBT', 'Bhaktivedanta Book Trust'];
  const BBT_BOOK_POINTS: { [key: string]: number } = {
    'Bhagavad-gita As It Is': 10,
    'Srimad-Bhagavatam': 15,
    'Krishna Book': 10,
    'Science of Self-Realization': 6,
    'Perfect Questions Perfect Answers': 4,
  };

  // Step-by-step guide for the page
  const PROCESS_STEPS = [
    {
      title: "Select Excel File",
      description: "Upload your monthly book distribution report in Excel format",
      icon: "document-outline"
    },
    {
      title: "Auto Processing",
      description: "The system will automatically analyze and calculate points",
      icon: "analytics-outline"
    },
    {
      title: "Review Data",
      description: "Verify the processed information before submission",
      icon: "checkmark-circle-outline"
    },
    {
      title: "Submit Report",
      description: "Upload your verified data to the central database",
      icon: "cloud-upload-outline"
    }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkUserAuthorization(currentUser.uid);
      } else {
        setIsAuthorized(false);
        navigation.navigate("Login" as never);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthorized) fetchMonthlyReports();
  }, [isAuthorized]);

  useEffect(() => {
    async function loadXLSX() {
      if (Platform.OS === 'web') {
        const xlsxModule = await import('xlsx');
        setXLSXRef(xlsxModule);
      } else {
        setXLSXRef(require('xlsx'));
      }
    }
    loadXLSX();
  }, []);

  const checkUserAuthorization = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const authorizedRoles = ['admin', 'core_team', 'national_coordinator'];
        if (authorizedRoles.includes(userData.role)) {
          setIsAuthorized(true);
        } else {
          Alert.alert("Access Denied", "You don't have permission to access this feature.");
          navigation.goBack();
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify authorization");
      navigation.goBack();
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
      
      reports.sort((a, b) => b.year - a.year);
      setMonthlyReports(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const selectDocument = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls';
      
      input.onchange = async (event: any) => {
        const file = event.target.files?.[0];
        if (file) {
          setSelectedFile({ name: file.name, uri: file });
          await processExcelFile(file);
        }
      };
      input.click();
    } else {
      try {
        const result = await DocumentPicker.pickSingle({
          type: [DocumentPicker.types.xlsx, DocumentPicker.types.xls],
        });
        setSelectedFile(result);
        await processExcelFile(result);
      } catch (error) {
        if (!DocumentPicker.isCancel(error)) {
          Alert.alert("Error", "Failed to select document");
        }
      }
    }
  };

  const processExcelFile = async (file: any) => {
    setLoading(true);
    try {
      if (!XLSXRef) {
        throw new Error("Excel processor not loaded");
      }

      let buffer;
      if (Platform.OS === 'web') {
        buffer = await file.arrayBuffer();
      } else {
        const response = await fetch(file.uri);
        buffer = await response.arrayBuffer();
      }

      const workbook = XLSXRef.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSXRef.utils.sheet_to_json(worksheet);

      const processedBooks = processBookData(jsonData);
      setProcessedData(processedBooks);
      
      Alert.alert("Success", `Processed ${processedBooks.length} books`);
    } catch (error) {
      Alert.alert("Error", "Failed to process Excel file");
    } finally {
      setLoading(false);
    }
  };

  const processBookData = (jsonData: any[]) => {
    const books: BookEntry[] = [];

    jsonData.forEach((row: any) => {
      const title = row['Book Title'] || row['Title'] || row['title'] || '';
      const quantity = parseInt(row['Quantity'] || row['Qty'] || '0');
      const publisher = row['Publisher'] || row['publisher'] || '';
      
      const isBBTBook = BBT_PUBLISHERS.some(pub => 
        publisher.toLowerCase().includes(pub.toLowerCase())
      ) || BBT_BOOK_POINTS.hasOwnProperty(title);

      const points = isBBTBook ? (BBT_BOOK_POINTS[title] || 1) : 0;

      if (title && quantity > 0) {
        books.push({
          title,
          quantity,
          points: points * quantity,
          publisher,
          isBBTBook
        });
      }
    });

    return books;
  };

  const uploadToFirestore = async () => {
    if (!processedData.length || !selectedFile) {
      Alert.alert("Error", "No data to upload");
      return;
    }
    
    setUploading(true);
    try {
      // Save books
      const batch = [];
      for (const book of processedData) {
        const bookRef = await addDoc(collection(db, "uploadedBooks"), {
          ...book,
          uploadedAt: serverTimestamp(),
          uploadedBy: user?.uid
        });
        batch.push(bookRef);
      }

      // Save monthly report
      const totalBooks = processedData.reduce((sum, book) => sum + book.quantity, 0);
      const totalPoints = processedData.reduce((sum, book) => sum + book.points, 0);
      
      const currentDate = new Date();
      const monthlyReport: Omit<MonthlyReport, 'id'> = {
        month: currentDate.toLocaleString('default', { month: 'long' }),
        year: currentDate.getFullYear(),
        totalBooks,
        totalPoints,
        books: processedData,
        uploadedBy: user?.uid || '',
        uploadedAt: serverTimestamp(),
        fileName: selectedFile.name
      };

      await addDoc(collection(db, "monthlyBookReports"), monthlyReport);
      
      Alert.alert("Success", "Data uploaded successfully!");
      setProcessedData([]);
      setSelectedFile(null);
      fetchMonthlyReports();
      
    } catch (error) {
      Alert.alert("Error", "Failed to upload data");
    } finally {
      setUploading(false);
    }
  };

  const deleteReport = (reportId: string) => {
    Alert.alert(
      "Delete Report",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "monthlyBookReports", reportId));
              Alert.alert("Success", "Report deleted");
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
      <View style={[styles.container, { backgroundColor: '#FDFCFA' }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={{
            marginTop: 16,
            fontSize: 16,
            color: '#666',
            fontWeight: '300'
          }}>
            Verifying your spiritual authority...
          </Text>
        </View>
      </View>
    );
  }

  const totalBooks = processedData.reduce((sum, book) => sum + book.quantity, 0);
  const totalPoints = processedData.reduce((sum, book) => sum + book.points, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="book-outline" size={28} color="#FF6B00" />
        <Text style={styles.headerText}>Sacred Book Points</Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Spiritual Quote */}
        <View style={{
          paddingVertical: 24,
          alignItems: 'center',
          marginBottom: 20
        }}>
          <Text style={{
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
            fontWeight: '300',
            fontStyle: 'italic',
            lineHeight: 24,
            letterSpacing: 0.2
          }}>
            "Books are the basis.{'\n'}Preach and read."
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
        {/* How It Works Section */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.howItWorksTitle}>Sacred Process</Text>
          <Text style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            marginBottom: 20,
            lineHeight: 20,
            fontWeight: '300'
          }}>
            Follow these blessed steps to contribute to book distribution
          </Text>
          <View style={styles.stepsContainer}>
            {PROCESS_STEPS.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name={step.icon as any} size={24} color="#FF6B00" />
                  <Text style={styles.stepNumber}>Step {index + 1}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Monthly Report</Text>
          <Text style={{
            fontSize: 14,
            color: '#666',
            marginBottom: 20,
            lineHeight: 20,
            fontWeight: '300'
          }}>
            Share your book distribution seva with the community
          </Text>
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={selectDocument}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Ionicons name="document-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {loading ? "Processing..." : "Select Excel File"}
            </Text>
          </TouchableOpacity>

          {selectedFile && (
            <Text style={styles.selectedFile}>
              ✓ Selected: {selectedFile.name}
            </Text>
          )}
        </View>

        {/* Upload to Firestore */}
        {processedData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ready for Offering</Text>
            <Text style={{
              fontSize: 14,
              color: '#666',
              marginBottom: 16,
              lineHeight: 20,
              fontWeight: '300'
            }}>
              Your seva summary is ready to be shared
            </Text>
            
            <View style={styles.stats}>
              <Text style={{ fontSize: 16, color: '#1A1A1A', marginBottom: 4, fontWeight: '400' }}>
                Total Books: {totalBooks}
              </Text>
              <Text style={{ fontSize: 16, color: '#1A1A1A', fontWeight: '400' }}>
                Total Points: {totalPoints}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.uploadButton, uploading && styles.buttonDisabled]}
              onPress={uploadToFirestore}
              disabled={uploading}
              activeOpacity={0.9}
            >
              <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>
                {uploading ? "Uploading..." : "Offer to Community"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Preview */}
        {processedData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blessed Books ({processedData.length} titles)</Text>
            {processedData.slice(0, 3).map((book, index) => (
              <View key={index} style={styles.bookItem}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={{ color: '#666', fontSize: 14, fontWeight: '300' }}>
                  Quantity: {book.quantity} | Points: {book.points}
                </Text>
                {book.isBBTBook && (
                  <Text style={{ 
                    color: '#FF6B00', 
                    fontSize: 12, 
                    marginTop: 4,
                    fontWeight: '400'
                  }}>
                    🙏 BBT Sacred Literature
                  </Text>
                )}
              </View>
            ))}
            {processedData.length > 3 && (
              <Text style={styles.moreText}>... and {processedData.length - 3} more blessed titles</Text>
            )}
          </View>
        )}

        {/* Reports History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sacred Service History</Text>
          
          {monthlyReports.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={styles.emptyText}>
                Your book distribution seva{'\n'}will appear here
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#999',
                marginTop: 8,
                fontWeight: '300',
                textAlign: 'center'
              }}>
                Begin your spiritual journey of sharing
              </Text>
            </View>
          ) : (
            monthlyReports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTitle}>
                    {report.month} {report.year}
                  </Text>
                  <TouchableOpacity onPress={() => deleteReport(report.id!)}>
                    <Ionicons name="trash-outline" size={16} color="#FF4444" />
                  </TouchableOpacity>
                </View>
                <Text style={{ color: '#666', fontSize: 14, fontWeight: '300' }}>
                  Books: {report.totalBooks} | Points: {report.totalPoints}
                </Text>
                <Text style={styles.fileName}>{report.fileName}</Text>
              </View>
            ))
          )}
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
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFCFA',
  },
  headerText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FF6B00',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '300',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
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
  button: {
    backgroundColor: '#FF6B00',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  selectedFile: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '400',
  },
  stats: {
    backgroundColor: '#FFF9F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  bookItem: {
    backgroundColor: '#FFF9F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  bookTitle: {
    fontWeight: '500',
    marginBottom: 6,
    color: '#1A1A1A',
    fontSize: 15,
  },
  moreText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 24,
    fontWeight: '300',
    fontSize: 16,
    lineHeight: 24,
  },
  reportCard: {
    backgroundColor: '#FFF9F5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF6B00',
    letterSpacing: 0.3,
  },
  fileName: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    fontWeight: '300',
  },
  howItWorksSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  howItWorksTitle: {
    fontSize: 24,
    fontWeight: '400',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  stepsContainer: {
    marginTop: 20,
  },
  stepCard: {
    backgroundColor: '#FFF9F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B00',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  stepIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B00',
    marginLeft: 12,
    letterSpacing: 0.2,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    fontWeight: '300',
  },
});