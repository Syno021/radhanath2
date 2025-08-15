import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Linking, RefreshControl } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { getWhatsappGroups } from '../services/WhatsappGroupService';
import { WhatsappGroup } from '../models/whatsappGroup.model';
import { sharedStyles, colors } from '../css/sharedStyles';

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

  return (
    <SafeAreaView style={sharedStyles.container}>
      <View style={sharedStyles.header}>
        <Ionicons name="logo-whatsapp" size={32} color="#25D366" />
        <Text style={sharedStyles.headerText}>WhatsApp Groups</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.churchOrange} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={sharedStyles.card} onPress={() => openInviteLink(item.inviteLink)}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={sharedStyles.cardTitle}>{item.name}</Text>
                  <Text style={sharedStyles.cardText}>{item.description}</Text>
                  {item.memberCount && (
                    <Text style={[sharedStyles.cardText, { color: "#999", fontSize: 12 }]}>
                      {item.memberCount} members
                    </Text>
                  )}
                </View>
                <Ionicons name="arrow-forward" size={20} color="#888" />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={[sharedStyles.cardText, { textAlign: "center", marginTop: 20 }]}>No groups available.</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.churchOrange]} />
          }
        />
      )}
    </SafeAreaView>
  );
}
