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
import * as DocumentPicker from 'expo-document-picker';

// Expo-compatible document picker
const getDocumentPicker = async () => {
  if (Platform.OS === 'web') {
    return null; // Web file selection handled separately
  } else {
    try {
      return {
        pickSingle: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: [
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-excel'
            ],
            copyToCacheDirectory: true,
            multiple: false
          });
          
          if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            return {
              name: asset.name,
              uri: asset.uri,
              type: asset.mimeType,
              size: asset.size
            };
          }
          throw new Error('User cancelled');
        },
        isCancel: (error: any) => error.message === 'User cancelled'
      };
    } catch (error) {
      console.warn('Document picker error:', error);
      return null;
    }
  }
};

const getXLSX = async () => {
  try {
    if (Platform.OS === 'web') {
      const xlsx = await import('xlsx');
      return xlsx;
    } else {
      // For Expo/React Native, use require
      const xlsx = require('xlsx');
      return xlsx;
    }
  } catch (error) {
    console.error('Failed to load XLSX:', error);
    return null;
  }
};

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

interface FileInfo {
  name: string;
  uri?: string;
  file?: File; // For web
  type?: string;
  size?: number;
}

export default function AdminBooks() {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [processedData, setProcessedData] = useState<BookEntry[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [documentPicker, setDocumentPicker] = useState<any>(null);
  const [xlsxLib, setXlsxLib] = useState<any>(null);
  const [librariesReady, setLibrariesReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

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

  // Initialize document picker and XLSX library
  useEffect(() => {
    const initializeLibraries = async () => {
      try {
        setInitError(null);
        
        const [docPicker, xlsx] = await Promise.all([
          getDocumentPicker(),
          getXLSX()
        ]);
        
        if (!xlsx) {
          throw new Error('XLSX library failed to load');
        }
        
        setDocumentPicker(docPicker);
        setXlsxLib(xlsx);
        setLibrariesReady(true);
        
        // Show info if document picker is not available
        if (Platform.OS !== 'web' && !docPicker) {
          setInitError('Document picker not available. Please install expo-document-picker.');
          
          // Show helpful alert
          setTimeout(() => {
            Alert.alert(
              'Setup Info',
              'To use file selection, install: expo install expo-document-picker',
              [{ text: 'OK' }]
            );
          }, 1000);
        }
        
      } catch (error) {
        console.error('Failed to initialize libraries:', error);
        setInitError(`Failed to initialize: ${error.message}`);
        setLibrariesReady(true); // Still set to true so UI shows
      }
    };

    initializeLibraries();
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

  // Web file selection handler
  const selectFileWeb = (): Promise<FileInfo | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls';
      input.style.display = 'none';
      
      input.onchange = (event: any) => {
        const file = event.target.files?.[0];
        if (file) {
          // Validate file type
          const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
          ];
          
          if (validTypes.includes(file.type) || file.name.match(/\.(xlsx|xls)$/i)) {
            resolve({ 
              name: file.name, 
              file,
              type: file.type,
              size: file.size 
            });
          } else {
            Alert.alert('Error', 'Please select a valid Excel file (.xlsx or .xls)');
            resolve(null);
          }
        } else {
          resolve(null);
        }
        document.body.removeChild(input);
      };
      
      input.oncancel = () => {
        document.body.removeChild(input);
        resolve(null);
      };
      
      document.body.appendChild(input);
      input.click();
    });
  };

  // Mobile file selection handler using Expo Document Picker
  const selectFileMobile = async (): Promise<FileInfo | null> => {
    if (!documentPicker) {
      Alert.alert(
        'Feature Unavailable', 
        'Document picker is not available. Please install expo-document-picker:\n\nexpo install expo-document-picker',
        [
          { 
            text: 'Copy Command', 
            onPress: () => {
              // Note: Clipboard API might not be available in all environments
              console.log('Command to copy: expo install expo-document-picker');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return null;
    }

    try {
      const result = await documentPicker.pickSingle({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ]
      });

      // Validate the result
      if (result && result.name && result.uri) {
        return result;
      } else {
        Alert.alert('Error', 'Invalid file selected');
        return null;
      }
    } catch (error: any) {
      if (documentPicker.isCancel && documentPicker.isCancel(error)) {
        // User cancelled - this is fine
        return null;
      } else {
        console.error('Document picker error:', error);
        
        let errorMessage = 'Failed to select file';
        if (error.message && !error.message.includes('cancelled')) {
          errorMessage += ': ' + error.message;
        }
        
        if (errorMessage !== 'Failed to select file') {
          Alert.alert('Error', errorMessage);
        }
        return null;
      }
    }
  };

  const selectDocument = async () => {
    if (!xlsxLib) {
      Alert.alert('Error', 'Excel processor not ready. Please try again.');
      return;
    }

    try {
      let fileInfo: FileInfo | null = null;

      if (Platform.OS === 'web') {
        fileInfo = await selectFileWeb();
      } else {
        fileInfo = await selectFileMobile();
      }

      if (fileInfo) {
        setSelectedFile(fileInfo);
        await processExcelFile(fileInfo);
      }
    } catch (error) {
      console.error('File selection error:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const processExcelFile = async (fileInfo: FileInfo) => {
    if (!xlsxLib) {
      Alert.alert('Error', 'Excel processor not available');
      return;
    }

    setLoading(true);
    try {
      let buffer: ArrayBuffer;

      if (Platform.OS === 'web' && fileInfo.file) {
        // Web file handling
        buffer = await fileInfo.file.arrayBuffer();
      } else if (fileInfo.uri) {
        // Mobile file handling with Expo
        try {
          const response = await fetch(fileInfo.uri);
          if (!response.ok) {
            throw new Error(`Failed to read file: ${response.status} ${response.statusText}`);
          }
          buffer = await response.arrayBuffer();
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          throw new Error('Failed to read the selected file. Please try selecting it again.');
        }
      } else {
        throw new Error('No valid file source available');
      }

      // Validate buffer
      if (!buffer || buffer.byteLength === 0) {
        throw new Error('The selected file appears to be empty or corrupted');
      }

      // Process the Excel file
      const workbook = xlsxLib.read(buffer, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('No sheets found in the Excel file');
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!worksheet) {
        throw new Error('Cannot read the first sheet');
      }

      // Convert to objects using the first row as headers
      const objectData = xlsxLib.utils.sheet_to_json(worksheet, {
        defval: '',
        blankrows: false
      });

      if (!objectData || objectData.length === 0) {
        throw new Error('No data found in the Excel file. Please check that the sheet contains data.');
      }

      const processedBooks = processBookData(objectData);
      
      if (processedBooks.length === 0) {
        Alert.alert(
          'No Valid Data Found', 
          'No valid book entries found in the file. Please ensure your Excel file has columns like:\n• Book Title or Title\n• Quantity or Qty\n• Publisher (optional)'
        );
      } else {
        setProcessedData(processedBooks);
        Alert.alert('Success', `Processed ${processedBooks.length} book entries successfully!`);
      }

    } catch (error: any) {
      console.error('Excel processing error:', error);
      let errorMessage = 'Failed to process Excel file';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Processing Error', errorMessage);
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  const processBookData = (jsonData: any[]): BookEntry[] => {
    const books: BookEntry[] = [];

    jsonData.forEach((row: any, index: number) => {
      try {
        // Handle different possible column names (case insensitive)
        const getColumnValue = (possibleNames: string[]) => {
          for (const name of possibleNames) {
            // Try exact match first
            if (row[name] !== undefined) return row[name];
            
            // Try case-insensitive match
            for (const key of Object.keys(row)) {
              if (key.toLowerCase() === name.toLowerCase()) {
                return row[key];
              }
            }
          }
          return '';
        };

        const title = getColumnValue(['Book Title', 'Title', 'title', 'Book', 'Name', 'book_title']);
        const quantityRaw = getColumnValue(['Quantity', 'Qty', 'quantity', 'Count', 'qty', 'count']);
        const publisher = getColumnValue(['Publisher', 'publisher', 'Pub', 'pub']);
        
        // Clean and parse quantity
        const quantity = parseInt(String(quantityRaw).replace(/[^\d]/g, '')) || 0;
        
        // Skip if no title or invalid quantity
        if (!title || typeof title !== 'string' || title.trim() === '' || quantity <= 0) {
          return;
        }

        const cleanTitle = String(title).trim();
        const cleanPublisher = String(publisher).trim();
        
        // Check if it's a BBT book
        const isBBTBook = BBT_PUBLISHERS.some(pub => 
          cleanPublisher.toLowerCase().includes(pub.toLowerCase())
        ) || BBT_BOOK_POINTS.hasOwnProperty(cleanTitle);

        // Calculate points
        const basePoints = isBBTBook ? (BBT_BOOK_POINTS[cleanTitle] || 1) : 0;
        const totalPoints = basePoints * quantity;

        books.push({
          title: cleanTitle,
          quantity,
          points: totalPoints,
          publisher: cleanPublisher,
          isBBTBook
        });

      } catch (rowError) {
        console.warn(`Error processing row ${index}:`, rowError);
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
      
      Alert.alert("Success", "Your seva has been uploaded successfully! 🙏");
      setProcessedData([]);
      setSelectedFile(null);
      fetchMonthlyReports();
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert("Error", "Failed to upload data. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const deleteReport = (reportId: string) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report?",
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

  // Show loading state if libraries aren't ready
  if (!librariesReady) {
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
            Preparing sacred tools...
          </Text>
        </View>
      </View>
    );
  }

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
        {/* Show setup info if document picker is not available */}
        {Platform.OS !== 'web' && !documentPicker && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#FF6B00" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.infoTitle}>Expo Document Picker Required</Text>
              <Text style={styles.infoText}>
                To upload files, install: expo install expo-document-picker
              </Text>
            </View>
          </View>
        )}

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
            style={[
              styles.button, 
              (loading || (Platform.OS !== 'web' && !documentPicker)) && styles.buttonDisabled
            ]}
            onPress={selectDocument}
            disabled={loading || (Platform.OS !== 'web' && !documentPicker)}
            activeOpacity={0.9}
          >
            <Ionicons name="document-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {loading ? "Processing..." : "Select Excel File"}
            </Text>
          </TouchableOpacity>

          {selectedFile && (
            <View style={styles.selectedFileContainer}>
              <Text style={styles.selectedFile}>
                ✓ Selected: {selectedFile.name}
              </Text>
              {selectedFile.size && (
                <Text style={styles.fileSize}>
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB
                </Text>
              )}
            </View>
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
  selectedFileContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '300',
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
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF6B00',
    marginLeft: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontWeight: '300',
    marginLeft: 12,
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF6B00',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '300',
  },
});