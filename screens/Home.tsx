import React from "react";
import { ScrollView, View, Text, TouchableOpacity, Image, useWindowDimensions, StatusBar } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../app/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import styles from "../css/homeStyles";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function Home() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { width } = useWindowDimensions();

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
            fontSize: 22,
            fontWeight: '600',
            color: '#FF6B00',
            letterSpacing: 0.5
          }}>
            BBT Africa Connect
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#999',
            fontWeight: '300',
            marginTop: 2
          }}>
            Hare Krishna Book Distribution
          </Text>
        </View>
        <TouchableOpacity
          style={{
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: '#FF6B00'
          }}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
            Register
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Welcome Hero */}
        <View style={{
          paddingHorizontal: 24,
          paddingVertical: 30,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 32,
            fontWeight: '300',
            color: '#1A1A1A',
            textAlign: 'center',
            lineHeight: 40,
            marginBottom: 12
          }}>
            Welcome to the{'\n'}Spiritual Journey
          </Text>
          <View style={{
            width: 50,
            height: 2,
            backgroundColor: '#FF6B00',
            marginBottom: 16
          }} />
          <Text style={{
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
            lineHeight: 24,
            fontWeight: '300'
          }}>
            Connect with Srila Prabhupada's books{'\n'}and your local Krishna community
          </Text>
        </View>

        {/* Sacred Books Access */}
        <View style={{
          paddingHorizontal: 24,
          marginBottom: 40
        }}>
          <TouchableOpacity style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 24,
            elevation: 2,
            shadowColor: '#FF6B00',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            alignItems: 'center'
          }}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop" }}
              style={{
                width: '100%',
                height: 160,
                borderRadius: 8,
                marginBottom: 16,
                opacity: 0.9
              }}
            />
            <Text style={{
              fontSize: 18,
              color: '#FF6B00',
              fontWeight: '500',
              marginBottom: 8
            }}>
              Srila Prabhupada's Books
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 12
            }}>
              Access the complete BBT Media  library
            </Text>
            <View style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              backgroundColor: '#FFF4E6',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#FF6B00'
            }}>
              <Text style={{ color: '#FF6B00', fontSize: 12, fontWeight: '500' }}>
                BBT Media 
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Main Features */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '400',
            color: '#1A1A1A',
            marginBottom: 24,
            letterSpacing: 0.3
          }}>
            Connect & Engage
          </Text>
          
          <View style={{ gap: 16 }}>
            {[
              {
                title: "Temple Connection",
                subtitle: "Connect with Sri Sri Radha Radhanath Temple",
                icon: "🏛️"
              },
              {
                title: "Local Nama Hatta",
                subtitle: "Join WhatsApp groups in your region",
                icon: "👥"
              },
              {
                title: "Reading Clubs",
                subtitle: "Meet like-minded devotees for book study",
                icon: "📖"
              },
              {
                title: "Share Feedback",
                subtitle: "Your experience with books & prasadam",
                icon: "💭"
              }
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: '#FFFFFF',
                  paddingVertical: 20,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  elevation: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4
                }}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#FFF4E6',
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16
                }}>
                  <Text style={{ fontSize: 18 }}>
                    {item.icon}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    color: '#1A1A1A',
                    fontWeight: '500',
                    marginBottom: 4
                  }}>
                    {item.title}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#666',
                    lineHeight: 18
                  }}>
                    {item.subtitle}
                  </Text>
                </View>
                <Text style={{
                  color: '#FF6B00',
                  fontSize: 18,
                  fontWeight: '300'
                }}>
                  →
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Get Started */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#FF6B00',
              paddingVertical: 18,
              borderRadius: 12,
              alignItems: 'center',
              elevation: 3,
              shadowColor: '#FF6B00',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8
            }}
            activeOpacity={0.9}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '600',
              letterSpacing: 0.3
            }}>
              Start Your Spiritual Journey
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              backgroundColor: 'transparent',
              paddingVertical: 18,
              borderRadius: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E0E0E0',
              marginTop: 12
            }}
            activeOpacity={0.7}
          >
            <Text style={{
              color: '#666',
              fontSize: 16,
              fontWeight: '400',
              letterSpacing: 0.3
            }}>
              Visit Temple Website
            </Text>
          </TouchableOpacity>
        </View>

        {/* QR Code Info */}
        <View style={{
          marginHorizontal: 24,
          backgroundColor: '#FFF9F5',
          padding: 20,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#FFE4CC',
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 14,
            color: '#FF6B00',
            fontWeight: '500',
            marginBottom: 8
          }}>
            📱 Scan QR Code
          </Text>
          <Text style={{
            fontSize: 13,
            color: '#666',
            textAlign: 'center',
            lineHeight: 18
          }}>
            Found this app through book distribution?{'\n'}
            Register to connect with our community
          </Text>
        </View>

        {/* Spiritual Quote */}
        <View style={{
          paddingHorizontal: 24,
          paddingVertical: 40,
          alignItems: 'center'
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
            marginTop: 12,
            fontWeight: '400'
          }}>
            - Srila Prabhupada
          </Text>
          <View style={{
            width: 30,
            height: 1,
            backgroundColor: '#DDD',
            marginTop: 16
          }} />
        </View>
      </ScrollView>
    </View>
  );
}