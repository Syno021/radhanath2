import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { getReadingClubs, requestToJoinClub } from '../services/ReadingClubService'; // Adjust path if needed
import { ReadingClub } from '../models/ReadingClub.model';
import { auth } from '../firebaseCo';

export default function ReadingClubsScreen() {
  const [clubs, setClubs] = useState<ReadingClub[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const data = await getReadingClubs();
        setClubs(data);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        Alert.alert('Error', 'Failed to load reading clubs.');
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const handleRequestToJoin = async (clubId: string, joinRequests?: string[], members?: string[]) => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to request to join.');
      return;
    }

    if (members?.includes(userId)) {
      Alert.alert('Info', 'You are already a member of this club.');
      return;
    }
    if (joinRequests?.includes(userId)) {
      Alert.alert('Info', 'You have already requested to join.');
      return;
    }

    try {
      await requestToJoinClub(clubId, userId);
      Alert.alert('Success', 'Your request has been sent to the admin.');
    } catch (error) {
      console.error('Error sending join request:', error);
      Alert.alert('Error', 'Could not send request. Try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF8C42" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="book-outline" size={32} color="#FF8C42" />
        <Text style={styles.headerText}>Reading Clubs</Text>
      </View>

      <FlatList
        data={clubs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.clubName}>{item.name}</Text>
            <Text style={styles.clubDescription}>{item.description}</Text>
            <Text style={styles.clubDetail}>Meeting: {item.schedule.day} at {item.schedule.time} ({item.schedule.frequency})</Text>
            {item.currentBook && <Text style={styles.clubDetail}>Current Book: {item.currentBook}</Text>}
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleRequestToJoin(item.id, item.joinRequests, item.members)}
            >
              <Text style={styles.joinButtonText}>Request to Join</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5E6' },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  headerText: { fontSize: 24, fontWeight: 'bold', marginLeft: 10, color: '#333' },
  card: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clubName: { fontSize: 18, fontWeight: 'bold', color: '#FF8C42' },
  clubDescription: { fontSize: 14, color: '#666', marginVertical: 5 },
  clubDetail: { fontSize: 13, color: '#444' },
  joinButton: {
    backgroundColor: '#FF8C42',
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 10,
  },
  joinButtonText: { color: '#FFF', fontWeight: 'bold', textAlign: 'center' },
});
