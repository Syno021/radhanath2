import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Region } from '../models/region.model';
import TempleService, { Temple } from '../services/TempleService';
import { getWhatsappGroupsByIds } from '../services/WhatsappGroupService';

type Params = {
  RegionDetails: { region: Region };
};

export default function RegionDetails() {
  const route = useRoute<RouteProp<Params, 'RegionDetails'>>();
  const { region } = route.params;

  const [temples, setTemples] = useState<Temple[]>([]);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; description?: string; inviteLink?: string; memberCount?: number }>>([]);
  const [loading, setLoading] = useState(true);

  // No theme overrides here; match Home screen's light styling

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [templesData, groupsData] = await Promise.all([
          TempleService.getTemplesByRegion(region.id),
          resolveWhatsappGroups(region.whatsappGroups)
        ]);
        if (!isMounted) return;
        setTemples(templesData);
        setGroups(groupsData);
      } catch (e) {
        // noop for now
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [region.id]);

  async function resolveWhatsappGroups(input: any): Promise<Array<{ id: string; name: string; description?: string; inviteLink?: string; memberCount?: number }>> {
    if (!Array.isArray(input) || input.length === 0) return [];
    // If already objects with id & name, normalize and return
    if (typeof input[0] === 'object') {
      return input.map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        inviteLink: g.inviteLink,
        memberCount: g.memberCount,
      }));
    }
    // Otherwise treat as string IDs and fetch
    const ids: string[] = input as string[];
    const groups = await getWhatsappGroupsByIds(ids);
    return groups.map((data) => ({
      id: data.id,
      name: data.name,
      description: data.description,
      inviteLink: data.inviteLink,
      memberCount: data.memberCount,
    }));
  }

  const openInviteLink = async (url?: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Try to prefix with https if missing scheme
        const fallback = url.startsWith('http') ? url : `https://${url}`;
        await Linking.openURL(fallback);
      }
    } catch (_) {
      // no-op
    }
  };

  return (
    <ScrollView style={{ backgroundColor: '#FDFCFA' }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{region.name}</Text>
      {!!region.description && <Text style={styles.description}>{region.description}</Text>}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        <Text style={styles.cardText}>Latitude: {region.location.latitude}</Text>
        <Text style={styles.cardText}>Longitude: {region.location.longitude}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Stats</Text>
        <Text style={styles.cardText}>Temples: {region.numberoftemples ?? 'N/A'}</Text>
        <Text style={styles.cardText}>WhatsApp Groups: {Array.isArray(region.whatsappGroups) ? region.whatsappGroups.length : 0}</Text>
        <Text style={styles.cardText}>Reading Clubs: {region.ReadingClubs?.length ?? 0}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Temples</Text>
        {loading ? (
          <View style={styles.loadingRow}><ActivityIndicator color="#FF6B00" /><Text style={styles.loadingText}> Loading temples...</Text></View>
        ) : temples.length === 0 ? (
          <Text style={styles.mutedText}>No temples found in this region.</Text>
        ) : (
          temples.map((t) => (
            <View key={t.id} style={styles.listRow}>
              <Ionicons name="business-outline" size={16} color="#FF6B00" />
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{t.name}</Text>
                {!!t.description && <Text style={styles.listSubtitle}>{t.description}</Text>}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>WhatsApp Groups</Text>
        {loading ? (
          <View style={styles.loadingRow}><ActivityIndicator color="#FF6B00" /><Text style={styles.loadingText}> Loading groups...</Text></View>
        ) : groups.length === 0 ? (
          <Text style={styles.mutedText}>No WhatsApp groups linked to this region.</Text>
        ) : (
          groups.map((g) => (
            <View key={g.id} style={styles.listRow}>
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{g.name}</Text>
                {!!g.description && <Text style={styles.listSubtitle}>{g.description}</Text>}
                {!!g.inviteLink && (
                  <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={styles.linkText} numberOfLines={1}>{g.inviteLink}</Text>
                    <TouchableOpacity
                      onPress={() => openInviteLink(g.inviteLink)}
                      style={styles.joinButton}
                      accessibilityRole="button"
                      accessibilityLabel={`Join chat ${g.name}`}
                    >
                      <Text style={styles.joinButtonText}>Join Chat</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FF6B00',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  listSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  mutedText: {
    fontSize: 13,
    color: '#777',
  },
  linkText: {
    fontSize: 12,
    color: '#FF6B00',
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
});


