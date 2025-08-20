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
      club.currentBook?.toLowerCase().includes(lowercaseSearch) ||
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

  // Render card item
  const renderClubCard = ({ item, index }: { item: ReadingClub, index: number }) => (
    <View style={[
      enhancedStyles.clubCard, 
      { marginLeft: index % 2 === 0 ? 20 : 10, marginRight: index % 2 === 0 ? 10 : 20 }
    ]}>
      <View style={enhancedStyles.cardHeader}>
        <View style={enhancedStyles.iconContainer}>
          <Ionicons name="book-outline" size={24} color="#FF6B00" />
        </View>
        <View style={enhancedStyles.membersInfo}>
          <Text style={enhancedStyles.memberCount}>
            {item.members?.length || 0} members
          </Text>
        </View>
      </View>
      
      <View style={enhancedStyles.cardContent}>
        <Text style={enhancedStyles.cardTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={enhancedStyles.cardDescription} numberOfLines={3}>
          {item.description}
        </Text>
        
        <View style={enhancedStyles.scheduleInfo}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={enhancedStyles.scheduleText}>
            {item.schedule.day} at {item.schedule.time}
          </Text>
        </View>
        
        {item.currentBook && (
          <View style={enhancedStyles.bookInfo}>
            <Ionicons name="bookmark-outline" size={14} color="#666" />
            <Text style={enhancedStyles.bookText} numberOfLines={2}>
              {item.currentBook}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={enhancedStyles.joinButton} 
        onPress={() => handleRequestToJoin(item.id, item.joinRequests, item.members)}
      >
        <Text style={enhancedStyles.joinButtonText}>Request to Join</Text>
        <Ionicons name="arrow-forward" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={enhancedStyles.container}>
        <View style={enhancedStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={enhancedStyles.loadingText}>Loading reading clubs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={enhancedStyles.container}>
      {/* Header */}
      <View style={enhancedStyles.header}>
        <View style={enhancedStyles.headerLeft}>
          <Text style={enhancedStyles.greeting}>Discover</Text>
          <Text style={enhancedStyles.headerTitle}>Reading Clubs</Text>
        </View>
        <View style={enhancedStyles.profileContainer}>
          <TouchableOpacity style={enhancedStyles.notificationButton}>
            <Ionicons name="notifications-outline" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={enhancedStyles.profileButton}>
            <Text style={enhancedStyles.userInitials}>
              {auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Section */}
      <View style={enhancedStyles.quickActionsContainer}>
        <View style={enhancedStyles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={enhancedStyles.searchIcon} />
          <TextInput
            style={enhancedStyles.searchInput}
            placeholder="Search clubs by name, description, book..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={handleReset} style={enhancedStyles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={enhancedStyles.buttonContainer}>
          <TouchableOpacity 
            style={[enhancedStyles.searchButton, searchTerm.trim().length === 0 && enhancedStyles.disabledButton]} 
            onPress={handleSearch}
            disabled={searchTerm.trim().length === 0}
          >
            <Ionicons name="search" size={16} color="white" />
            <Text style={enhancedStyles.searchButtonText}>Search</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[enhancedStyles.resetButton, searchTerm.length === 0 && enhancedStyles.disabledButton]} 
            onPress={handleReset}
            disabled={searchTerm.length === 0}
          >
            <Ionicons name="refresh" size={16} color="#FF6B00" />
            <Text style={enhancedStyles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Info */}
      <View style={enhancedStyles.resultsInfo}>
        <Text style={enhancedStyles.resultsText}>
          {searchTerm.trim() ? 
            `Found ${filteredClubs.length} club${filteredClubs.length !== 1 ? 's' : ''} for "${searchTerm}"` :
            `Showing all ${clubs.length} reading clubs`
          }
        </Text>
      </View>

      {/* Clubs Grid */}
      <FlatList
        ref={flatListRef}
        data={filteredClubs}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={enhancedStyles.scrollContent}
        ListEmptyComponent={() => (
          <View style={enhancedStyles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#ddd" />
            <Text style={enhancedStyles.emptyText}>
              {searchTerm.trim() ? 
                'No clubs found matching your search' : 
                'No reading clubs available'
              }
            </Text>
            {searchTerm.trim() && (
              <TouchableOpacity style={enhancedStyles.emptyButton} onPress={handleReset}>
                <Text style={enhancedStyles.emptyButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        renderItem={renderClubCard}
      />

      {/* Scroll to Top Button */}
      {contentHeight > scrollViewHeight && !isAtTop && (
        <TouchableOpacity style={enhancedStyles.scrollToTop} onPress={scrollToTop}>
          <Ionicons name="chevron-up" size={24} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// Enhanced styles based on the first document
const enhancedStyles = {
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
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    color: '#666',
    fontWeight: '500' as const,
  },

  // Content Styles
  scrollContent: {
    paddingBottom: 40,
  },

  // Club Card Styles
  clubCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#FDFCFA', // Same as page background
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF6B00', // Primary color border
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  membersInfo: {
    alignItems: 'flex-end' as const,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500' as const,
  },
  
  cardContent: {
    flex: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400' as const,
    lineHeight: 20,
    marginBottom: 12,
  },
  scheduleInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  bookInfo: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  bookText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  
  joinButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
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
    color: '#666',
    fontWeight: '500' as const,
  },

  // Empty States
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 20,
    width: screenWidth,
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