import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../app/navigation/AppNavigator";
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
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import DocumentPicker from 'react-native-document-picker';
import XLSX from 'xlsx';

type LoadBookScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LoadBook"
>;

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

export default function LoadBook() {
  const navigation = useNavigation<LoadBookScreenNavigationProp>();
  
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
        navigation.navigate("Login");
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
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error("Authorization check error:", error);
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFCFA' }}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={{ marginTop: 16, color: '#666' }}>Checking authorization...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 16, color: '#FF6B00', fontWeight: '500', marginRight: 8 }}>
              ←
            </Text>
            <Text style={{ fontSize: 16, color: '#FF6B00', fontWeight: '500' }}>
              Back
            </Text>
          </TouchableOpacity>
          
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#FF6B00',
            letterSpacing: 0.5
          }}>
            Log Book Points
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Welcome Section */}
          <View style={{
            paddingHorizontal: 24,
            paddingVertical: 20,
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '300',
              color: '#1A1A1A',
              textAlign: 'center',
              lineHeight: 32,
              marginBottom: 12
            }}>
              Monthly Book Points
            </Text>
            <View style={{
              width: 40,
              height: 2,
              backgroundColor: '#FF6B00',
              marginBottom: 16
            }} />
            <Text style={{
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
              lineHeight: 20,
              fontWeight: '300'
            }}>
              Upload Excel files to track BBT book distribution points
            </Text>
          </View>

          {/* Upload Section */}
          <View style={{
            paddingHorizontal: 24,
            marginBottom: 30
          }}>
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              ...(Platform.OS === 'web' 
                ? { boxShadow: '0 4px 12px rgba(255, 107, 0, 0.08)' }
                : { elevation: 3 }
              )
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#1A1A1A',
                marginBottom: 16,
                textAlign: 'center'
              }}>
                Upload Monthly Report
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: loading ? '#FFB380' : '#FF6B00',
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  ...(Platform.OS === 'web'
                    ? { boxShadow: '0 4px 8px rgba(255, 107, 0, 0.2)' }
                    : { elevation: 2 }
                  )
                }}
                onPress={selectDocument}
                disabled={loading}
                activeOpacity={0.9}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                  letterSpacing: 0.3
                }}>
                  {loading ? "Processing..." : "Select Excel File"}
                </Text>
              </TouchableOpacity>

              <Text style={{
                fontSize: 12,
                color: '#666',
                textAlign: 'center',
                lineHeight: 16,
                marginTop: 12
              }}>
                Supported formats: .xlsx, .xls{'\n'}
                Required columns: Book Title, Quantity, Publisher
              </Text>
            </View>
          </View>

          {/* Preview Data */}
          {uploadedData.length > 0 && (
            <View style={{
              paddingHorizontal: 24,
              marginBottom: 30
            }}>
              <View style={{
                backgroundColor: '#FFF9F5',
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: '#FFE4CC'
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#FF6B00',
                  marginBottom: 16
                }}>
                  Preview: {uploadedData.length} Books Found
                </Text>
                
                {uploadedData.slice(0, 5).map((book, index) => (
                  <View key={index} style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: book.isBBTBook ? '#FF6B00' : '#DDD'
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1A1A' }}>
                      {book.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      Qty: {book.quantity} | Points: {book.totalPoints} | {book.isBBTBook ? 'BBT Book' : 'Other'}
                    </Text>
                  </View>
                ))}
                
                {uploadedData.length > 5 && (
                  <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 8 }}>
                    ... and {uploadedData.length - 5} more books
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Monthly Reports History */}
          <View style={{
            paddingHorizontal: 24,
            marginBottom: 30
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#1A1A1A',
              marginBottom: 16
            }}>
              Monthly Reports History
            </Text>

            {monthlyReports.length === 0 ? (
              <View style={{
                backgroundColor: '#FFF9F5',
                borderRadius: 12,
                padding: 20,
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                  No monthly reports uploaded yet
                </Text>
              </View>
            ) : (
              monthlyReports.map((report) => (
                <View key={report.id} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 12,
                  ...(Platform.OS === 'web'
                    ? { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }
                    : { elevation: 2 }
                  )
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#FF6B00',
                        marginBottom: 4
                      }}>
                        {report.month} {report.year}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        File: {report.fileName}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => deleteReport(report.id!)}
                      style={{
                        backgroundColor: '#FFE4E4',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#FF4444' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 8
                  }}>
                    <Text style={{ fontSize: 14, color: '#666' }}>
                      Total Books: <Text style={{ fontWeight: '500', color: '#1A1A1A' }}>{report.totalBooks}</Text>
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666' }}>
                      BBT Books: <Text style={{ fontWeight: '500', color: '#FF6B00' }}>{report.totalBBTBooks}</Text>
                    </Text>
                  </View>
                  
                  <View style={{
                    backgroundColor: '#FF6B00',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    alignSelf: 'flex-start'
                  }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#FFFFFF'
                    }}>
                      Total Points: {report.totalPoints}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* BBT Books Info */}
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
              "Books are the basis; preach and read them."
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
      </View>
    </KeyboardAvoidingView>
  );
}