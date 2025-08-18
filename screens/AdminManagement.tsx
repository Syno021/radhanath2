import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminManagementStackParamList } from '../app/navigation/AdminManagementStack';

type AdminManagementNavigationProp = NativeStackNavigationProp<AdminManagementStackParamList, 'AdminManagementHome'>;

export default function AdminManagement() { 
  const navigation = useNavigation<AdminManagementNavigationProp>();

  const options = [
    { 
      label: 'Rate Books', 
      subtitle: 'Manage spiritual literature',
      icon: 'book-outline', 
      route: 'AdminBooks',
      emoji: '📚'
    },
    { 
      label: 'Add Books', 
      subtitle: 'Add Books to the library',
      icon: 'book-outline', 
      route: 'AdminAddBooks',
      emoji: '📚'
    },
    { 
      label: 'Add Groups', 
      subtitle: 'Create community circles',
      icon: 'people-outline', 
      route: 'AdminGroups',
      emoji: '👥'
    },
    { 
      label: 'Add Regions', 
      subtitle: 'Expand temple reach',
      icon: 'location-outline', 
      route: 'AdminRdm',
      emoji: '🗺️'
    }, 
    { 
      label: 'Add Book Clubs', 
      subtitle: 'Foster reading communities',
      icon: 'library-outline', 
      route: 'AdminClubs',
      emoji: '📖'
    },
    { 
      label: 'Manage Temples', 
      subtitle: 'Organize spiritual centers',
      icon: 'home-outline', 
      route: 'AdminTemples',
      emoji: '🏛️'
    }
  ] as const;

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
            Admin Management
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#999',
            fontWeight: '300',
            marginTop: 2
          }}>
            Spiritual Community Administration
          </Text>
        </View>
        <View style={{
          paddingHorizontal: 18,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: '#FFF4E6',
          borderWidth: 1,
          borderColor: '#FF6B00'
        }}>
          <Text style={{ color: '#FF6B00', fontSize: 12, fontWeight: '500' }}>
            Admin Panel
          </Text>
        </View>
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
            Temple Management{'\n'}Dashboard
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
            Manage books, communities, and{'\n'}spiritual connections with devotion
          </Text>
        </View>

        {/* Main Management Options */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '400',
            color: '#1A1A1A',
            marginBottom: 24,
            letterSpacing: 0.3
          }}>
            Management Tools
          </Text>
          
          <View style={{ gap: 16 }}>
            {options.map((item, index) => (
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
                onPress={() => navigation.navigate(item.route)}
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
                    {item.emoji}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    color: '#1A1A1A',
                    fontWeight: '500',
                    marginBottom: 4
                  }}>
                    {item.label}
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

        {/* Manage Users - Special Card */}
        <View style={{
          paddingHorizontal: 24,
          marginBottom: 40
        }}>
          <TouchableOpacity 
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 24,
              elevation: 2,
              shadowColor: '#FF6B00',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#FFE4CC'
            }}
            activeOpacity={0.8} 
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <View style={{
              width: 60,
              height: 60,
              backgroundColor: '#FFF4E6',
              borderRadius: 30,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Text style={{ fontSize: 28 }}>
                👥
              </Text>
            </View>
            <Text style={{
              fontSize: 18,
              color: '#FF6B00',
              fontWeight: '500',
              marginBottom: 8
            }}>
              Manage Users
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 12
            }}>
              Oversee devotee accounts and{'\n'}community participation
            </Text>
            <View style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              backgroundColor: '#FF6B00',
              borderRadius: 16
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                User Management
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Admin Stats or Quick Actions */}
        <View style={{
          marginHorizontal: 24,
          backgroundColor: '#FFF9F5',
          padding: 20,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#FFE4CC',
          alignItems: 'center',
          marginBottom: 40
        }}>
          <Text style={{
            fontSize: 14,
            color: '#FF6B00',
            fontWeight: '500',
            marginBottom: 8
          }}>
            🕉️ Temple Administration
          </Text>
          <Text style={{
            fontSize: 13,
            color: '#666',
            textAlign: 'center',
            lineHeight: 18
          }}>
            Serving the devotee community with{'\n'}organized spiritual resources
          </Text>
        </View>

        {/* Spiritual Quote */}
        <View style={{
          paddingHorizontal: 24,
          paddingVertical: 30,
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
            "Organization is the manifestation{'\n'}of love and service."
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#999',
            marginTop: 12,
            fontWeight: '400'
          }}>
            - Administrative Wisdom
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