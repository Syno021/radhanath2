import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useHotReload } from '../services/ScrollableService';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Linking, RefreshControl, TextInput, Dimensions } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { getWhatsappGroups } from '../services/WhatsappGroupService';
import { WhatsappGroup } from '../models/whatsappGroup.model';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 60) / 2; // Account for padding and gap

export default function UserWhatsappGroups() {
  // React Native FlatList ref
  const flatListRef = useRef<FlatList<WhatsappGroup>>(null);
  
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

  const [groups, setGroups] = useState<WhatsappGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search state with hot reload persistence
  const [searchTerm, setSearchTerm] = useHotReload('clubs-search-term', '');
  const [isSearchActive, setIsSearchActive] = useState(false);

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

  // Filter groups based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) {
      return groups;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    return groups.filter(group => 
      group.name?.toLowerCase().includes(searchLower) ||
      group.description?.toLowerCase().includes(searchLower)
    );
  }, [groups, searchTerm]);

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
    fetchGroups();
  };

  const openInviteLink = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't open link", err));
    }
  };

  const renderEmptyComponent = () => {
    if (searchTerm.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            No groups found for "{searchTerm}"
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleReset}>
            <Text style={styles.emptyButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <Text style={[styles.cardDescription, { textAlign: "center", marginTop: 20, color: '#666' }]}>
        No groups available.
      </Text>
    );
  };

  const renderGroupItem = ({ item, index }: { item: WhatsappGroup; index: number }) => (
    <TouchableOpacity 
      style={[
        styles.exploreCard, 
        { 
          width: cardWidth, 
          marginRight: index % 2 === 0 ? 16 : 0,
          marginBottom: 16 
        }
      ]} 
      onPress={() => openInviteLink(item.inviteLink)}
    >
      <View style={[
        styles.cardGradient, 
        { 
          backgroundColor: '#25D366',
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
        }
      ]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
            <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || "Join this WhatsApp group to connect with members"}
          </Text>
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.countContainer}>
            {item.memberCount && (
              <Text style={styles.countText}>
                {item.memberCount} members
              </Text>
            )}
          </View>
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Connect & Share</Text>
          <Text style={styles.headerTitle}>WhatsApp Groups</Text>
        </View>
        <View style={styles.profileContainer}>
          <Ionicons name="logo-whatsapp" size={32} color="#25D366" />
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups by name or description..."
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

      {/* Search Results Info */}
      {searchTerm.trim() && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingStatsContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Loading WhatsApp groups...</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={filteredGroups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroupItem}
            numColumns={2}
            columnWrapperStyle={styles.exploreGrid}
            contentContainerStyle={styles.scrollContent}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B00']} />
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
          
          {/* Scroll to Top Button */}
          {!isAtTop && (
            <TouchableOpacity style={styles.scrollToTop} onPress={scrollToTop}>
              <Ionicons name="arrow-up" size={24} color="white" />
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// Updated styles based on shared styles
const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4CC',
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

  // Search Container
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FDFCFA',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4CC',
  },
  searchInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
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
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resetButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resultsInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF9F5',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },

  // Content Styles
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Loading Styles
  loadingStatsContainer: {
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },

  // Explore Grid (for two columns)
  exploreGrid: {
    gap: 16,
  },
  exploreCard: {
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
    justifyContent: 'space-between' as const,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    marginBottom: 16,
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

  // Empty State
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },

  // Scroll to Top Button
  scrollToTop: {
    position: 'absolute' as const,
    right: 20,
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