import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import styles from '../css/Explore';

export default function Explore() {
  const userInitials = 'JD';

  const options = [
    { label: 'View Books', icon: <Ionicons name="book-outline" size={22} color="#FF8C42" /> },
    { label: 'View Groups', icon: <Ionicons name="people-outline" size={22} color="#FF8C42" /> },
    { label: 'View Regions', icon: <Ionicons name="location-outline" size={22} color="#FF8C42" /> },
    { label: 'View Book Clubs', icon: <Ionicons name="library-outline" size={22} color="#FF8C42" /> },
    { label: 'View All Temples', icon: <Ionicons name="business-outline" size={22} color="#FF8C42" /> },
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
