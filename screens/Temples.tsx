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


const { width: screenWidth } = Dimensions.get('window');

export default function TempleScreen() {
  const scrollViewRef = useRef<ScrollView>(null);

  const [temples, setTemples] = useState<Temple[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredTemples, setFilteredTemples] = useState<Temple[]>([]);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);

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

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(currentScrollY > 300);
  };

  if (loading && temples.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Loading temples...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.headerTitle}>Temples</Text>
        </View>
        <View style={styles.profileContainer}>
          <View style={styles.notificationBadge}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={20} color="#666" />
            </TouchableOpacity>
            <View style={styles.notificationDot} />
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.userInitials}>T</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.quickActionsContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search temples by name, region..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.searchButton, loading && styles.disabledButton]} 
            onPress={handleSearch}
            disabled={loading}
          >
            <Ionicons name="search" size={16} color="white" />
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.resetButton, loading && styles.disabledButton]} 
            onPress={handleResetSearch}
            disabled={loading}
          >
            <Ionicons name="refresh" size={16} color="#FF6B00" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B00" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Temples Grid */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.exploreGrid}>
          {filteredTemples.map((temple: Temple, index: number) => (
            <TouchableOpacity key={temple.id} style={styles.exploreCard} activeOpacity={0.8}>
              <View
                style={[styles.cardGradient, { backgroundColor: getCardColor(index) }]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                    <Ionicons name="library-outline" size={24} color="#FFFFFF" />
                  </View>
                  {index === 0 && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredText}>Featured</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, index === 0 && styles.featuredTitle]}>
                    {temple.name}
                  </Text>
                  {temple.description && (
                    <Text style={[styles.cardDescription, index === 0 && styles.featuredDescription]} numberOfLines={2}>
                      {temple.description}
                    </Text>
                  )}
                </View>
                
                <View style={styles.cardFooter}>
                  <View style={styles.countContainer}>
                    <Text style={styles.countText}>
                      {temple.regionName || getRegionName(temple.regionId)}
                    </Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State */}
        {filteredTemples.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={48} color="#FF6B00" />
            <Text style={styles.emptyText}>
              {searchTerm ? 'No temples match your search.' : 'No temples found.'}
            </Text>
            {searchTerm && (
              <TouchableOpacity onPress={handleResetSearch} style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>


      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <TouchableOpacity style={styles.scrollToTop} onPress={scrollToTop}>
          <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// Helper function to get card colors
const getCardColor = (index: number): string => {
  const colors = [
    '#FF6B00', // Orange
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A', // Changed to black
    letterSpacing: 0.3,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBadge: {
    position: 'relative',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4757',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Quick Actions (Search Section)
  quickActionsContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FDFCFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A', // Changed to black
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: '600',
  },

  // Results Info
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FDF8',
  },
  resultsText: {
    fontSize: 14,
    color: '#1A1A1A', // Changed to black
    fontWeight: '500',
  },

  // Content Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A', // Changed to black
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#1A1A1A', // Changed to black
    fontWeight: '400',
    marginBottom: 24,
    lineHeight: 20,
  },

  // Explore Grid
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  exploreCard: {
    width: (screenWidth - 60) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    marginBottom: 8,
  },
  cardGradient: {
    padding: 20,
    minHeight: 140,
    flex: 1, // Add this to ensure full coverage
    backgroundColor: '#FF6B00', // Ensure background color is always applied
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'auto', // Changed from fixed 16 to auto to push content to bottom
  },

  cardContent: {
    flex: 1,
    justifyContent: 'flex-end', // Push content to bottom instead of space-between
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  featuredTitle: {
    fontSize: 22,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 16,
  },
  featuredDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countContainer: {
    flex: 1,
  },
  countText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loading States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#1A1A1A', // Changed to black
    fontWeight: '500',
  },

  // Empty States
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#1A1A1A', // Changed to black
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FDFCFA',
    borderTopWidth: 1,
    borderTopColor: '#E8F5E8',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A', // Changed to black
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B00',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#1A1A1A', // Changed to black
    fontWeight: '500',
    textAlign: 'center',
  },

  // Scroll to Top Button
  scrollToTop: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: '#FF6B00',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});