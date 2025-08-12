import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { getRegions } from '../services/regionService'; // Adjust path if needed
import { Region } from '../models/region.model';

export default function AdminBooks() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

    const renderRegion = ({ item }: { item: Region }) => (
    <View style={styles.regionCard}>
        <Text style={styles.regionName}>{item.name}</Text>
        {item.description && <Text style={styles.regionDetail}>Description: {item.description}</Text>}
        <Text style={styles.regionDetail}>
        Location: Lat {item.location.latitude}, Lng {item.location.longitude}
        </Text>
        <Text style={styles.regionDetail}>
        Temples: {item.numberoftemples ?? 'N/A'}
        </Text>
        <Text style={styles.regionDetail}>
        WhatsApp Groups: {item.whatsappGroups?.length ?? 0}
        </Text>
        <Text style={styles.regionDetail}>
        Reading Clubs: {item.ReadingClubs?.length ?? 0}
        </Text>
    </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="book-outline" size={32} color="#FF8C42" />
        <Text style={styles.headerText}>Regions</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF8C42" />
        ) : (
          <FlatList
            data={regions}
            keyExtractor={(item) => item.id}
            renderItem={renderRegion}
            ListEmptyComponent={<Text>No regions found.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  regionCard: {
    backgroundColor: '#FFF',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderColor: '#FFDAB9',
    borderWidth: 1,
  },
  regionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  regionDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
