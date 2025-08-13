import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { auth, db } from "../firebaseCo";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { signOut, User } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../app/navigation/AppNavigator";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Profile"
>;

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  photoURL: string;
  region: string;
  registrationDate: any;
  lastActive: any;
  pushToken: string;
  bookInterests: string[];
  joinedGroups: string[];
  joinedReadingClubs: string[];
  role: string;
}

export default function Profile() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { width } = useWindowDimensions();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const fetchUserData = async (uid: string) => {
    try {
      setLoading(true);
      
      // Set up real-time listener for user data
      const userDocRef = doc(db, "users", uid);
      const unsubscribeDoc = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          setUserData(docSnapshot.data() as UserData);
        } else {
          console.log("No user document found");
          setUserData(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load profile data");
        setLoading(false);
      });

      return unsubscribeDoc;
    } catch (error) {
      console.error("Error setting up user data listener:", error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (currentUser) {
      setRefreshing(true);
      await fetchUserData(currentUser.uid);
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.navigate("Login");
            } catch (error: any) {
              console.error("Sign out error:", error);
              Alert.alert("Error", "Failed to sign out");
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FDFCFA' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={{
            fontSize: 16,
            color: '#666',
            marginTop: 16,
            fontWeight: '300'
          }}>
            Loading profile...
          </Text>
        </View>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FDFCFA' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={{
            fontSize: 24,
            color: '#FF6B00',
            fontWeight: '300',
            textAlign: 'center',
            marginBottom: 16
          }}>
            Not Signed In
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 22
          }}>
            Please sign in to view your profile
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#FF6B00',
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderRadius: 12
            }}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '600'
            }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
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
        <View>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#FF6B00',
            letterSpacing: 0.5
          }}>
            My Profile
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#FF6B00'
          }}
        >
          <Text style={{
            color: '#FF6B00',
            fontSize: 14,
            fontWeight: '500'
          }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Header */}
        <View style={{
          paddingHorizontal: 24,
          paddingVertical: 20,
          alignItems: 'center'
        }}>
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#FFF9F5',
            borderWidth: 3,
            borderColor: '#FF6B00',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          }}>
            {userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={{
                  width: 94,
                  height: 94,
                  borderRadius: 47
                }}
              />
            ) : (
              <Text style={{
                fontSize: 36,
                color: '#FF6B00',
                fontWeight: '300'
              }}>
                {userData?.displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          
          <Text style={{
            fontSize: 24,
            fontWeight: '300',
            color: '#1A1A1A',
            textAlign: 'center',
            marginBottom: 4
          }}>
            {userData?.displayName || currentUser.displayName || 'No Name'}
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: '#666',
            fontWeight: '300'
          }}>
            {userData?.email || currentUser.email}
          </Text>
          
          {userData?.role && (
            <View style={{
              backgroundColor: '#FF6B00',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginTop: 8
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: '500',
                textTransform: 'capitalize'
              }}>
                {userData.role}
              </Text>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View style={{
          paddingHorizontal: 24,
          marginBottom: 20
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            elevation: 3,
            shadowColor: '#FF6B00',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#FF6B00',
              marginBottom: 20
            }}>
              Account Information
            </Text>

            {/* Phone Number */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Phone Number
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {userData?.phoneNumber || 'Not provided'}
              </Text>
            </View>

            {/* Region */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Region
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {userData?.region || 'Not specified'}
              </Text>
            </View>

            {/* Registration Date */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Member Since
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {formatDate(userData?.registrationDate)}
              </Text>
            </View>

            {/* Last Active */}
            <View>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Last Active
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {formatDate(userData?.lastActive)}
              </Text>
            </View>
          </View>
        </View>

        {/* Interests & Activities */}
        <View style={{
          paddingHorizontal: 24,
          marginBottom: 20
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            elevation: 3,
            shadowColor: '#FF6B00',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#FF6B00',
              marginBottom: 20
            }}>
              My Activities
            </Text>

            {/* Book Interests */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 8
              }}>
                Book Interests ({userData?.bookInterests?.length || 0})
              </Text>
              {userData?.bookInterests?.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {userData.bookInterests.map((interest, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: '#FFF9F5',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        marginRight: 8,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: '#FFE4CC'
                      }}
                    >
                      <Text style={{
                        fontSize: 12,
                        color: '#FF6B00',
                        fontWeight: '400'
                      }}>
                        {interest}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{
                  fontSize: 14,
                  color: '#999',
                  fontStyle: 'italic'
                }}>
                  No interests added yet
                </Text>
              )}
            </View>

            {/* Joined Groups */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Joined Groups
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {userData?.joinedGroups?.length || 0} groups
              </Text>
            </View>

            {/* Reading Clubs */}
            <View>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 4
              }}>
                Reading Clubs
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#1A1A1A',
                fontWeight: '300'
              }}>
                {userData?.joinedReadingClubs?.length || 0} clubs
              </Text>
            </View>
          </View>
        </View>

        {/* Spiritual Quote */}
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
            "The supreme goal of human life is to{'\n'}develop love for Krishna."
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
  );
}