import React, { useEffect, useState, useRef } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  StyleSheet,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import TempleService, { Temple, Region } from '../services/TempleService';

const { width } = Dimensions.get('window');

// Theme colors
const colors = {
  churchOrange: "#FF8C42",
  churchDark: "#5A2D0C",
  churchLight: "#FFF5E6",
  churchAccent: "#FFD580",
  white: "#FFFFFF",
  danger: "#b33a3a",
  textSecondary: "#333333",
  border: "#e0e0e0",
  shadow: "#000000",
};

export default function TempleScreen() {
  const scrollViewRef = useRef<ScrollView>(null);

  const [temples, setTemples] = useState<Temple[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredTemples, setFilteredTemples] = useState<Temple[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const filtered = TempleService.searchTemples(temples, searchTerm);
    setFilteredTemples(filtered);
  }, [temples, searchTerm]);

  const loadInitialData = async (): Promise<void> => {
    await Promise.all([loadTemples(), loadRegions()]);
  };

  const loadTemples = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await TempleService.getTemples();
      setTemples(data);
      setFilteredTemples(data);
    } catch (err) {
      setError('Failed to load temples');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async (): Promise<void> => {
    try {
      const data = await TempleService.getRegions();
      setRegions(data);
    } catch (err) {
      setError('Failed to load regions');
      console.error(err);
    }
  };

  const handleSearch = (): void => {
    const filtered = TempleService.searchTemples(temples, searchTerm);
    setFilteredTemples(filtered);
  };

  const handleResetSearch = (): void => {
    setSearchTerm('');
    setFilteredTemples(temples);
  };

  const getRegionName = (regionId: string): string => {
    const region = regions.find(r => r.id === regionId);
    return region?.name || 'Unknown Region';
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    if (timestamp && typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    return 'N/A';
  };

  const scrollToTop = (): void => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const scrollToBottom = (): void => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  if (loading && temples.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.churchOrange} />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Loading temples...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <Ionicons name="library-outline" size={32} color={colors.churchOrange} />
            <Text style={styles.headerText}>Temples</Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search temples by name, description, or region..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <View style={styles.searchButtons}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleSearch}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.buttonSecondary} 
                onPress={handleResetSearch}
                disabled={loading}
              >
                <Text>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Status Info */}
          <View style={styles.headerActions}>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Temples: {temples.length}</Text>
              <Text style={styles.statusText}>Filtered: {filteredTemples.length}</Text>
              <Text style={styles.statusText}>Regions: {regions.length}</Text>
            </View>
          </View>

          {/* Scroll Controls */}
          <View style={styles.scrollControls}>
            <TouchableOpacity style={styles.scrollButton} onPress={scrollToTop}>
              <Text style={styles.scrollButtonText}>↑ Top</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scrollButton} onPress={scrollToBottom}>
              <Text style={styles.scrollButtonText}>↓ Bottom</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)} style={styles.errorDismiss}>
              <Text style={styles.errorDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Temples Grid */}
        <View style={styles.clubsList}>
          {filteredTemples.map((temple: Temple) => (
            <View key={temple.id} style={styles.card}>
              {temple.imageUrl && (
                <View style={styles.cardImageContainer}>
                  <Image 
                    source={{ uri: temple.imageUrl }} 
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{temple.name}</Text>
                {temple.description && (
                  <Text style={styles.cardText}>{temple.description}</Text>
                )}
                <Text style={styles.cardText}>
                  <Text style={styles.cardLabel}>🏛️ Region: </Text>
                  {temple.regionName || getRegionName(temple.regionId)}
                </Text>
                <Text style={styles.cardText}>
                  <Text style={styles.cardLabel}>📅 Created: </Text>
                  {formatTimestamp(temple.createdAt)}
                </Text>
                {temple.updatedAt && (
                  <Text style={styles.cardText}>
                    <Text style={styles.cardLabel}>✏️ Updated: </Text>
                    {formatTimestamp(temple.updatedAt)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Empty */}
        {filteredTemples.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchTerm ? 'No temples match your search.' : 'No temples found.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.churchLight,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  stickyHeader: {
    backgroundColor: colors.white,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    color: colors.churchDark,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.white,
    fontSize: 16,
  },
  searchButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: colors.churchOrange,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.churchOrange,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  headerActions: {
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  scrollControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  scrollButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  scrollButtonText: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  errorDismiss: {
    marginTop: 8,
  },
  errorDismissText: {
    color: 'red',
    textDecorationLine: 'underline',
  },
  clubsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: (width - 48) / 2,
    backgroundColor: colors.churchLight,
    borderWidth: 2,
    borderColor: colors.churchOrange,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  cardImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.churchDark,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  cardLabel: {
    fontWeight: '600',
    color: colors.churchDark,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 32,
    padding: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
});
