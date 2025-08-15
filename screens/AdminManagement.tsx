import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminManagementStackParamList } from '../app/navigation/AdminManagementStack';
import styles from "../css/management";

type AdminManagementNavigationProp = NativeStackNavigationProp<AdminManagementStackParamList, 'AdminManagementHome'>;

export default function AdminManagement() { 
  const navigation = useNavigation<AdminManagementNavigationProp>();

  const options = [
    { label: 'Add Books', icon: <Ionicons name="book-outline" size={28} color="#FF8C42" />, route: 'AdminBooks' },
    { label: 'Add Groups', icon: <Ionicons name="people-outline" size={28} color="#FF8C42" />, route: 'AdminGroups' },
    { label: 'Add Regions', icon: <Ionicons name="location-outline" size={28} color="#FF8C42" /> , route: 'AdminRdm' }, 
    { label: 'Add Book Clubs', icon: <Ionicons name="library-outline" size={28} color="#FF8C42" />, route: 'AdminClubs' },
  ] as const;

  return (
    <View style={styles.container}>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.grid}>
        {options.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => 'route' in item ? navigation.navigate(item.route) : null}
          >
            <View style={styles.cardIcon}>{item.icon}</View>
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Manage Users full-width card */}
        <TouchableOpacity style={styles.manageCard} activeOpacity={0.8} onPress={() => navigation.navigate('AdminUsers')}>
          <View style={styles.cardIcon}>
            <Ionicons name="person-circle-outline" size={28} color="#FF8C42" />
          </View>
          <Text style={styles.cardText}>Manage Users</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
