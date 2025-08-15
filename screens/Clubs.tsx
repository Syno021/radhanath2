import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { getReadingClubs, requestToJoinClub } from '../services/ReadingClubService';
import { ReadingClub } from '../models/ReadingClub.model';
import { auth } from '../firebaseCo'; 
import { sharedStyles, colors } from '../css/sharedStyles';

export default function ReadingClubsScreen() {
  const [clubs, setClubs] = useState<ReadingClub[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    (async () => {
      try {
        const data = await getReadingClubs();
        setClubs(data);
      } catch {
        Alert.alert('Error', 'Failed to load reading clubs.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRequestToJoin = async (clubId: string, joinRequests?: string[], members?: string[]) => {
    if (!userId) return Alert.alert('Error', 'You must be logged in to request to join.');
    if (members?.includes(userId)) return Alert.alert('Info', 'You are already a member.');
    if (joinRequests?.includes(userId)) return Alert.alert('Info', 'You have already requested.');
    try {
      await requestToJoinClub(clubId, userId);
      Alert.alert('Success', 'Request sent.');
    } catch {
      Alert.alert('Error', 'Could not send request.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={sharedStyles.container}>
        <ActivityIndicator size="large" color="#FF8C42" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.container}>
      <View style={sharedStyles.header}>
        <Ionicons name="book-outline" size={32} color="#FF8C42" />
        <Text style={sharedStyles.headerText}>Reading Clubs</Text>
      </View>

      <FlatList
        data={clubs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={sharedStyles.card}>
            <Text style={sharedStyles.cardTitle}>{item.name}</Text>
            <Text style={sharedStyles.cardText}>{item.description}</Text>
            <Text style={sharedStyles.cardText}>
              Meeting: {item.schedule.day} at {item.schedule.time} ({item.schedule.frequency})
            </Text>
            {item.currentBook && <Text style={sharedStyles.cardText}>Current Book: {item.currentBook}</Text>}
            <TouchableOpacity style={sharedStyles.button} onPress={() => handleRequestToJoin(item.id, item.joinRequests, item.members)}>
              <Text style={sharedStyles.buttonText}>Request to Join</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
