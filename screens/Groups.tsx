import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Linking, 
  RefreshControl 
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { getWhatsappGroups } from '../services/WhatsappGroupService'; // adjust path
import { WhatsappGroup } from '../models/whatsappGroup.model';

export default function UserWhatsappGroups() {
  const [groups, setGroups] = useState<WhatsappGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await getWhatsappGroups();
      setGroups(data);
    } catch (error) {
      console.error("Error fetching WhatsApp groups:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const openInviteLink = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't open link", err));
    }
  };

  const renderGroup = ({ item }: { item: WhatsappGroup }) => (
    <TouchableOpacity style={styles.card} onPress={() => openInviteLink(item.inviteLink)}>
      <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupDescription}>{item.description}</Text>
        {item.memberCount && (
          <Text style={styles.memberCount}>{item.memberCount} members</Text>
        )}
      </View>
      <Ionicons name="arrow-forward" size={20} color="#888" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="book-outline" size={32} color="#FF8C42" />
        <Text style={styles.headerText}>WhatsApp Groups</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF8C42" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No groups available.</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8C42']} />
          }
        />
      )}
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  memberCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 16,
  },
});
