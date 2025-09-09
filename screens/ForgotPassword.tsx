import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { RootStackParamList } from "../app/navigation/AppNavigator";
import { auth } from "../firebaseCo";

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;

export default function ForgotPassword() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { width } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      Alert.alert(
        "Email Sent",
        "Password reset instructions have been sent to your email address. Please check your inbox and follow the instructions to reset your password.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login")
          }
        ]
      );
    } catch (error: any) {
      let errorMessage = "An error occurred while sending the reset email.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      Alert.alert("Error", errorMessage);
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
            onPress={() => navigation.navigate("Login")}
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
              Reset Password
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
              Enter your email to receive reset instructions
            </Text>
          </View>

          {/* Reset Form */}
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
              <View style={{ marginBottom: 32 }}>
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
                  placeholder="Enter your email address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!emailSent}
                />
              </View>

              {/* Reset Button */}
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
                onPress={handleResetPassword}
                disabled={loading || emailSent}
                activeOpacity={0.9}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                  letterSpacing: 0.3
                }}>
                  {loading ? "Sending..." : emailSent ? "Email Sent" : "Send Reset Email"}
                </Text>
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  marginTop: 20
                }}
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.7}
              >
                <Text style={{
                  fontSize: 14,
                  color: '#666',
                  fontWeight: '400'
                }}>
                  Remember your password? Sign in
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructions */}
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
                lineHeight: 22,
                fontWeight: '500'
              }}>
                What happens next?
              </Text>
              
              <View style={{ alignItems: 'flex-start', width: '100%' }}>
                <Text style={{
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 20,
                  marginBottom: 8
                }}>
                  • Check your email inbox for reset instructions
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 20,
                  marginBottom: 8
                }}>
                  • Click the link in the email to reset your password
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 20,
                  marginBottom: 8
                }}>
                  • Create a new secure password
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 20
                }}>
                  • Return here to sign in with your new password
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
              "The path of spiritual progress is never lost{'\n'}when one sincerely seeks guidance."
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
