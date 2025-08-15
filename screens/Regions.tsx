import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { getRegions } from '../services/regionService';
import { Region } from '../models/region.model';
import { sharedStyles, colors } from '../css/sharedStyles';


export default function AdminBooks() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const data = await getRegions();
        setRegions(data);
      } catch (error) {
        console.error('Error fetching regions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, []);

  return (
    <SafeAreaView style={sharedStyles.container}>
      <View style={sharedStyles.header}>
        <Ionicons name="map-outline" size={32} color={colors.churchOrange} />
        <Text style={sharedStyles.headerText}>Regions</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.churchOrange} />
      ) : (
        <FlatList
          data={regions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={sharedStyles.card}>
              <Text style={sharedStyles.cardTitle}>{item.name}</Text>
              {item.description && (
                <Text style={sharedStyles.cardText}>Description: {item.description}</Text>
              )}
              <Text style={sharedStyles.cardText}>
                Location: Lat {item.location.latitude}, Lng {item.location.longitude}
              </Text>
              <Text style={sharedStyles.cardText}>
                Temples: {item.numberoftemples ?? 'N/A'}
              </Text>
              <Text style={sharedStyles.cardText}>
                WhatsApp Groups: {item.whatsappGroups?.length ?? 0}
              </Text>
              <Text style={sharedStyles.cardText}>
                Reading Clubs: {item.ReadingClubs?.length ?? 0}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={sharedStyles.cardText}>No regions found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}
