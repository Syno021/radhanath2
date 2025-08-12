import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../app/navigation/ExploreStack';
import styles from '../css/Explore';

type ExploreNavigationProp = NativeStackNavigationProp<ExploreStackParamList, 'Explore'>;

export default function Explore() {
  const navigation = useNavigation<ExploreNavigationProp>();
  const userInitials = 'JD';

  const options = [
    { label: 'View Regions', icon: <Ionicons name="location-outline" size={22} color="#FF8C42" />, route: 'Regions' },
    { label: 'View Books', icon: <Ionicons name="book-outline" size={22} color="#FF8C42" />, route: 'Book' },
    { label: 'View Groups', icon: <Ionicons name="people-outline" size={22} color="#FF8C42" />, route: 'Groups' },
    { label: 'View Book Clubs', icon: <Ionicons name="library-outline" size={22} color="#FF8C42" />, route: 'Clubs' },
    { label: 'View All Temples', icon: <Ionicons name="business-outline" size={22} color="#FF8C42" />, route: 'Temples' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.userInitials}>{userInitials}</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {options.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate({ name: item.route as any, params: undefined })}
          >
            <View style={styles.cardLeft}>
              <View style={styles.cardIcon}>{item.icon}</View>
              <Text style={styles.cardText}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={22} color="#aaa" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
