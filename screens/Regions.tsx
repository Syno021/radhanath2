import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useHotReload } from '../services/ScrollableService';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Dimensions } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { getRegions } from '../services/regionService';
import { Region } from '../models/region.model';

const { width: screenWidth } = Dimensions.get('window');

export default function AdminBooks() {
  // React Native FlatList ref
  const flatListRef = useRef<FlatList<Region>>(null);
  
  // Scroll state for React Native
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  
  // Scroll functions for React Native
  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };
  
  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };
  
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const currentScrollPosition = contentOffset.y;
    
    setScrollPosition(currentScrollPosition);
    setContentHeight(contentSize.height);
    setScrollViewHeight(layoutMeasurement.height);
    
    // Check if at top or bottom with threshold
    const threshold = 50;
    setIsAtTop(currentScrollPosition < threshold);
    setIsAtBottom(
      currentScrollPosition > contentSize.height - layoutMeasurement.height - threshold
    );
  };

  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search state with hot reload persistence
  const [searchTerm, setSearchTerm] = useHotReload('regions-search-term', '');
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const data = await getRegions();
      setRegions(data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter regions based on search term
  const filteredRegions = useMemo(() => {
    if (!searchTerm.trim()) {
      return regions;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    return regions.filter(region => 
      region.name?.toLowerCase().includes(searchLower) ||
      region.description?.toLowerCase().includes(searchLower)
    );
  }, [regions, searchTerm]);

  // Search handlers
  const handleSearch = () => {
    setIsSearchActive(true);
    // Scroll to top when searching to show results from beginning
    scrollToTop();
  };

  const handleReset = () => {
    setSearchTerm('');
    setIsSearchActive(false);
    // Scroll to top when resetting
    scrollToTop();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRegions();
  };

  const renderEmptyComponent = () => {
    if (searchTerm.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            No regions found for "{searchTerm}"
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleReset}>
            <Text style={styles.emptyButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="map-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No regions found.</Text>
      </View>
    );
  };

  const renderRegionCard = ({ item, index }: { item: Region; index: number }) => {
    return (
      <View style={styles.exploreCard}>
        <View style={[styles.cardGradient, { backgroundColor: '#FF6B00' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
              <Ionicons name="map" size={24} color="#FFFFFF" />
            </View>
            {index === 0 && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>
          
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, index === 0 && styles.featuredTitle]}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={[styles.cardDescription, index === 0 && styles.featuredDescription]} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.cardFooter}>
              <View style={styles.countContainer}>
                <Text style={styles.countText}>
                  {item.numberoftemples ?? 0} temples • {item.ReadingClubs?.length ?? 0} clubs
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderListHeader = () => {
    return (
      <>
        <Text style={styles.sectionTitle}>Explore Regions</Text>
        <Text style={styles.sectionSubtitle}>
          Discover temples and reading clubs in different regions
        </Text>
      </>
    );
  };

  const renderLoadingOrContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Loading regions...</Text>
        </View>
      );
    }

    return (
      <FlatList
        ref={flatListRef}
        data={filteredRegions}
        keyExtractor={(item) => item.id}
        renderItem={renderRegionCard}
        numColumns={2}
        columnWrapperStyle={filteredRegions.length > 0 ? styles.exploreGrid : null}
        contentContainerStyle={styles.flatListContent}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.headerTitle}>Regions</Text>
        </View>
        <View style={styles.profileContainer}>
          <View style={styles.notificationBadge}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={20} color="#666" />
            </TouchableOpacity>
            <View style={styles.notificationDot} />
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.userInitials}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fixed Search Section */}
      <View style={styles.quickActionsContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search regions by name or description..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={handleReset} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.searchButton, searchTerm.trim().length === 0 && styles.disabledButton]} 
            onPress={handleSearch}
            disabled={searchTerm.trim().length === 0}
          >
            <Ionicons name="search" size={16} color="white" />
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.resetButton, searchTerm.length === 0 && styles.disabledButton]} 
            onPress={handleReset}
            disabled={searchTerm.length === 0}
          >
            <Ionicons name="refresh" size={16} color="#FF6B00" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fixed Search Results Info */}
      {searchTerm.trim() && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filteredRegions.length} region{filteredRegions.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Scrollable Content Area */}
      <View style={styles.scrollableContent}>
        {renderLoadingOrContent()}
      </View>

      {/* Scroll to Top Button */}
      {!isAtTop && (
        <TouchableOpacity style={styles.scrollToTop} onPress={scrollToTop}>
          <Ionicons name="arrow-up" size={24} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  
  // Header Styles (Fixed)
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
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
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  profileContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  notificationBadge: {
    position: 'relative' as const,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  notificationDot: {
    position: 'absolute' as const,
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
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    elevation: 2,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },

  // Fixed Search Section
  quickActionsContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FDFCFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },
  searchInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
    color: '#333',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    fontWeight: '600' as const,
  },
  resetButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: '600' as const,
  },

  // Fixed Results Info
  resultsInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FDF8',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },

  // Scrollable Content Area
  scrollableContent: {
    flex: 1,
  },

  // FlatList Content Styles
  flatListContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding at bottom for scroll to top button
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400' as const,
    marginBottom: 24,
    lineHeight: 20,
  },

  // Explore Grid
  exploreGrid: {
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  exploreCard: {
    width: (screenWidth - 60) / 2, // Account for padding and gap
    borderRadius: 16,
    overflow: 'hidden' as const,
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

  // Also update the cardContent style to ensure proper spacing:
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end' as const, // Push content to bottom instead of space-between
  },

  // And update cardHeader to have proper spacing:
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 0,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  featuredTitle: {
    fontSize: 22,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    marginBottom: 16,
  },
  featuredDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  countContainer: {
    flex: 1,
  },
  countText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Loading States
  loadingContainer: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    flex: 1,
    justifyContent: 'center' as const,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },

  // Empty States
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
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
    fontWeight: '600' as const,
  },

  // Scroll to Top Button
  scrollToTop: {
    position: 'absolute' as const,
    right: 16,
    bottom: 20,
    backgroundColor: '#FF6B00',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
};