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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseCo";
import { doc, getDoc } from "firebase/firestore";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export default function Login() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { width } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        Alert.alert("Error", "User data not found.");
        return;
      }

      const role = userDoc.data().role;

      if (role === "admin") {
        navigation.navigate("AdminTabs");
      } else {
        navigation.navigate("UserTabs");
      }

    } catch (error: any) {
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
              Welcome Back
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
              Continue your spiritual journey
            </Text>
          </View>

          {/* Login Form */}
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
              <View style={{ marginBottom: 32 }}>
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
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Login Button */}
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
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                  letterSpacing: 0.3
                }}>
                  {loading ? "Signing In..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  marginTop: 20
                }}
                activeOpacity={0.7}
              >
                <Text style={{
                  fontSize: 14,
                  color: '#666',
                  fontWeight: '400'
                }}>
                  Forgot your password?
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Section */}
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
                New to our spiritual community?
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
                onPress={() => navigation.navigate("Register")}
                activeOpacity={0.7}
              >
                <Text style={{
                  color: '#FF6B00',
                  fontSize: 16,
                  fontWeight: '500',
                  letterSpacing: 0.3
                }}>
                  Create Account
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
              "The spiritual master opens the door of the{'\n'}darkest ignorance."
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