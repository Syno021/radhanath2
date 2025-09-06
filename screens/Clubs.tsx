import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useHotReload } from '../services/ScrollableService';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Dimensions } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { getReadingClubs, requestToJoinClub } from '../services/ReadingClubService';
import { ReadingClub } from '../models/ReadingClub.model';
import { auth } from '../firebaseCo'; 
import { sharedStyles, colors } from '../css/sharedStyles';

const { width: screenWidth } = Dimensions.get('window');

export default function ReadingClubsScreen() {
  // React Native FlatList ref
  const flatListRef = useRef<FlatList<ReadingClub>>(null);
  
  // Scroll state for React Native
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
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
    setShowScrollToTop(currentScrollPosition > 300);
  };

  const [clubs, setClubs] = useState<ReadingClub[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;
  
  // Search state with hot reload persistence
  const [searchTerm, setSearchTerm] = useHotReload('clubs-search-term', '');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Load clubs data
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

  // Filtered clubs based on search term
  const filteredClubs = useMemo(() => {
    if (!searchTerm.trim()) {
      return clubs;
    }

    const lowercaseSearch = searchTerm.toLowerCase().trim();
    
    return clubs.filter(club => 
      club.name.toLowerCase().includes(lowercaseSearch) ||
      club.description.toLowerCase().includes(lowercaseSearch) ||
      club.currentBookId?.toLowerCase().includes(lowercaseSearch) ||
      club.schedule.day.toLowerCase().includes(lowercaseSearch) ||
      club.schedule.frequency.toLowerCase().includes(lowercaseSearch)
    );
  }, [clubs, searchTerm]);

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

  // Get card color based on index
  const getCardColor = (index: number): string => {
    const colors = [
      '#FF6B00', // Orange
    ];
    return colors[index % colors.length];
  };

  // Render card item using enhanced grid card styles
  const renderClubCard = ({ item, index }: { item: ReadingClub, index: number }) => (
    <TouchableOpacity style={styles.exploreCard} activeOpacity={0.8}>
      <View style={[styles.cardGradient, { backgroundColor: getCardColor(index) }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Ionicons name="book-outline" size={24} color="#FFFFFF" />
          </View>
          {index === 0 && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, index === 0 && styles.featuredTitle]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.cardDescription, index === 0 && styles.featuredDescription]} numberOfLines={3}>
            {item.description}
          </Text>
          
          {item.currentBookId && (
            <View style={styles.bookInfoSection}>
              <Ionicons name="bookmark-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.bookInfoText} numberOfLines={1}>
                {item.currentBookId}
              </Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.cardFooterButton} 
          onPress={() => handleRequestToJoin(item.id, item.joinRequests, item.members)}
        >
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              {item.members?.length || 0} members • {item.schedule.day}
            </Text>
          </View>
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Loading reading clubs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Discover</Text>
          <Text style={styles.headerTitle}>Reading Clubs</Text>
        </View>
        <View style={styles.profileContainer}>
          <View style={styles.notificationBadge}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={20} color="#666" />
            </TouchableOpacity>
            <View style={styles.notificationDot} />
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.userInitials}>
              {auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.quickActionsContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clubs by name, description, book..."
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

      {/* Clubs Grid */}
      <FlatList
        ref={flatListRef}
        data={filteredClubs}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        columnWrapperStyle={styles.exploreGrid}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color="#FF6B00" />
            <Text style={styles.emptyText}>
              {searchTerm.trim() ? 
                'No clubs found matching your search' : 
                'No reading clubs available'
              }
            </Text>
            {searchTerm.trim() && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleReset}>
                <Text style={styles.emptyButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        renderItem={renderClubCard}
      />

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <TouchableOpacity style={styles.scrollToTop} onPress={scrollToTop}>
          <Ionicons name="arrow-up" size={24} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// Enhanced styles based on the first document
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

  // Quick Actions (Search Section)
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

  // Results Info
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
    color: '#1A1A1A',
    fontWeight: '500' as const,
  },

  // Section Header
  sectionHeaderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '400' as const,
    lineHeight: 20,
  },

  // Content Styles
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Explore Grid
  exploreGrid: {
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  exploreCard: {
    width: (screenWidth - 60) / 2,
    borderRadius: 16,
    overflow: 'hidden' as const,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    marginBottom: 8,
  },
  // Replace the existing cardGradient, cardHeader, and cardContent styles in the TempleScreen with these updated versions:

cardGradient: {
  padding: 20,
  minHeight: 140,
  flex: 1, // Add this to ensure full coverage
  backgroundColor: '#FF6B00', // Ensure background color is always applied
},

cardHeader: {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'flex-start' as const,
  marginBottom: 0,
},

cardContent: {
  flex: 1,
  justifyContent: 'flex-end' as const, // Push content to bottom instead of space-between
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
    marginBottom: 12,
  },
  featuredDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  bookInfoSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  bookInfoText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500' as const,
    marginLeft: 6,
    flex: 1,
  },
  cardFooterButton: {
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
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500' as const,
  },

  // Empty States
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 20,
    width: screenWidth - 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#1A1A1A',
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
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FF6B00',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500' as const,
    textAlign: 'center' as const,
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