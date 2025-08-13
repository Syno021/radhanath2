import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../app/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebaseCo";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

export default function Register() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { width } = useWindowDimensions();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update displayName in Firebase Auth profile
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Create Firestore user document based on your model
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email,
        displayName: name,
        phoneNumber: "",
        photoURL: "",
        region: "",
        registrationDate: serverTimestamp(),
        lastActive: serverTimestamp(),
        pushToken: "",
        bookInterests: [],
        joinedGroups: [],
        joinedReadingClubs: [],
        role: "user",
      });

      Alert.alert("Success", "Account created successfully.");
      navigation.navigate("Login");
    } catch (error: any) {
      console.error("Registration Error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

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
            onPress={() => navigation.navigate("Home")}
            style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Text style={{
              fontSize: 16,
              color: '#FF6B00',
              fontWeight: '500',
              marginRight: 8
            }}>
              ←
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#FF6B00',
              fontWeight: '500'
            }}>
              Back
            </Text>
          </TouchableOpacity>
          
          <View>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#FF6B00',
              letterSpacing: 0.5
            }}>
              BBT Africa Connect
            </Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Welcome Section */}
          <View style={{
            paddingHorizontal: 24,
            paddingVertical: 30,
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 28,
              fontWeight: '300',
              color: '#1A1A1A',
              textAlign: 'center',
              lineHeight: 36,
              marginBottom: 12
            }}>
              Join Our Community
            </Text>
            <View style={{
              width: 40,
              height: 2,
              backgroundColor: '#FF6B00',
              marginBottom: 16
            }} />
            <Text style={{
              fontSize: 16,
              color: '#666',
              textAlign: 'center',
              lineHeight: 22,
              fontWeight: '300'
            }}>
              Begin your spiritual journey with us
            </Text>
          </View>

          {/* Registration Form */}
          <View style={{
            paddingHorizontal: 24,
            marginBottom: 40
          }}>
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 28,
              elevation: 3,
              shadowColor: '#FF6B00',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12
            }}>
              
              {/* Name Input */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontSize: 14,
                  color: '#FF6B00',
                  fontWeight: '500',
                  marginBottom: 8,
                  letterSpacing: 0.3
                }}>
                  Full Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFF9F5',
                    borderWidth: 1,
                    borderColor: name ? '#FF6B00' : '#FFE4CC',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    fontSize: 16,
                    color: '#1A1A1A',
                    fontWeight: '400'
                  }}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Email Input */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontSize: 14,
                  color: '#FF6B00',
                  fontWeight: '500',
                  marginBottom: 8,
                  letterSpacing: 0.3
                }}>
                  Email Address
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFF9F5',
                    borderWidth: 1,
                    borderColor: email ? '#FF6B00' : '#FFE4CC',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    fontSize: 16,
                    color: '#1A1A1A',
                    fontWeight: '400'
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontSize: 14,
                  color: '#FF6B00',
                  fontWeight: '500',
                  marginBottom: 8,
                  letterSpacing: 0.3
                }}>
                  Password
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFF9F5',
                    borderWidth: 1,
                    borderColor: password ? '#FF6B00' : '#FFE4CC',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    fontSize: 16,
                    color: '#1A1A1A',
                    fontWeight: '400'
                  }}
                  placeholder="Create a password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Confirm Password Input */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{
                  fontSize: 14,
                  color: '#FF6B00',
                  fontWeight: '500',
                  marginBottom: 8,
                  letterSpacing: 0.3
                }}>
                  Confirm Password
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFF9F5',
                    borderWidth: 1,
                    borderColor: confirmPassword ? '#FF6B00' : '#FFE4CC',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    fontSize: 16,
                    color: '#1A1A1A',
                    fontWeight: '400'
                  }}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: loading ? '#FFB380' : '#FF6B00',
                  paddingVertical: 18,
                  borderRadius: 12,
                  alignItems: 'center',
                  elevation: 2,
                  shadowColor: '#FF6B00',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8
                }}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.9}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                  letterSpacing: 0.3
                }}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Text>
              </TouchableOpacity>

              {/* Terms & Privacy */}
              <View style={{
                alignItems: 'center',
                marginTop: 20
              }}>
                <Text style={{
                  fontSize: 13,
                  color: '#666',
                  fontWeight: '300',
                  textAlign: 'center',
                  lineHeight: 18
                }}>
                  By creating an account, you agree to our{'\n'}
                  <Text style={{ color: '#FF6B00', fontWeight: '400' }}>Terms of Service</Text> and{' '}
                  <Text style={{ color: '#FF6B00', fontWeight: '400' }}>Privacy Policy</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Login Section */}
          <View style={{
            paddingHorizontal: 24,
            marginBottom: 40
          }}>
            <View style={{
              backgroundColor: '#FFF9F5',
              borderRadius: 12,
              padding: 24,
              borderWidth: 1,
              borderColor: '#FFE4CC',
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 16,
                color: '#666',
                textAlign: 'center',
                marginBottom: 16,
                lineHeight: 22
              }}>
                Already part of our community?
              </Text>
              
              <TouchableOpacity
                style={{
                  backgroundColor: 'transparent',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#FF6B00'
                }}
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.7}
              >
                <Text style={{
                  color: '#FF6B00',
                  fontSize: 16,
                  fontWeight: '500',
                  letterSpacing: 0.3
                }}>
                  Sign In
                </Text>
              </TouchableOpacity>
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
              "A moment's association with a devotee by{'\n'}hearing and chanting is most valuable."
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