import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useHotReload } from '../services/ScrollableService';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { getReadingClubs, requestToJoinClub } from '../services/ReadingClubService';
import { ReadingClub } from '../models/ReadingClub.model';
import { auth } from '../firebaseCo'; 
import { sharedStyles, colors } from '../css/sharedStyles';

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

  if (loading) {
    return (
      <SafeAreaView style={sharedStyles.container}>
        <ActivityIndicator size="large" color="#FF8C42" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.container}>
      {/* Header */}
      <View style={sharedStyles.header}>
        <Ionicons name="book-outline" size={32} color="#FF8C42" />
        <Text style={sharedStyles.headerText}>Reading Clubs</Text>
      </View>

      {/* Search Section */}
      <View style={searchStyles.searchContainer}>
        <View style={searchStyles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={searchStyles.searchIcon} />
          <TextInput
            style={searchStyles.searchInput}
            placeholder="Search clubs by name, description, book, or schedule..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={handleReset} style={searchStyles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={searchStyles.buttonContainer}>
          <TouchableOpacity 
            style={[searchStyles.searchButton, searchTerm.trim().length === 0 && searchStyles.disabledButton]} 
            onPress={handleSearch}
            disabled={searchTerm.trim().length === 0}
          >
            <Ionicons name="search" size={16} color="white" />
            <Text style={searchStyles.searchButtonText}>Search</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[searchStyles.resetButton, searchTerm.length === 0 && searchStyles.disabledButton]} 
            onPress={handleReset}
            disabled={searchTerm.length === 0}
          >
            <Ionicons name="refresh" size={16} color="#FF8C42" />
            <Text style={searchStyles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Info */}
      <View style={searchStyles.resultsInfo}>
        <Text style={searchStyles.resultsText}>
          {searchTerm.trim() ? 
            `Found ${filteredClubs.length} club${filteredClubs.length !== 1 ? 's' : ''} for "${searchTerm}"` :
            `Showing all ${clubs.length} reading clubs`
          }
        </Text>
        {contentHeight > scrollViewHeight && (
          <Text style={searchStyles.scrollInfo}>
            {Math.round((scrollPosition / (contentHeight - scrollViewHeight)) * 100) || 0}% scrolled
          </Text>
        )}
      </View>

      {/* Clubs List */}
      <FlatList
        ref={flatListRef}
        data={filteredClubs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={() => (
          <View style={searchStyles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={searchStyles.emptyText}>
              {searchTerm.trim() ? 
                'No clubs found matching your search' : 
                'No reading clubs available'
              }
            </Text>
            {searchTerm.trim() && (
              <TouchableOpacity style={searchStyles.emptyButton} onPress={handleReset}>
                <Text style={searchStyles.emptyButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={sharedStyles.card}>
            <Text style={sharedStyles.cardTitle}>{item.name}</Text>
            <Text style={sharedStyles.cardText}>{item.description}</Text>
            <Text style={sharedStyles.cardText}>
              Meeting: {item.schedule.day} at {item.schedule.time} ({item.schedule.frequency})
            </Text>
            {item.currentBook && (
              <Text style={sharedStyles.cardText}>Current Book: {item.currentBook}</Text>
            )}
            <TouchableOpacity 
              style={sharedStyles.button} 
              onPress={() => handleRequestToJoin(item.id, item.joinRequests, item.members)}
            >
              <Text style={sharedStyles.buttonText}>Request to Join</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Scroll Controls */}
      {contentHeight > scrollViewHeight && !isAtTop && (
        <TouchableOpacity style={searchStyles.scrollToTop} onPress={scrollToTop}>
          <Ionicons name="chevron-up" size={24} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// Search-specific styles
const searchStyles = {
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
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
    backgroundColor: '#FF8C42',
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
    borderColor: '#FF8C42',
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
    color: '#FF8C42',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resultsInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  scrollInfo: {
    fontSize: 12,
    color: '#999',
  },
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
    backgroundColor: '#FF8C42',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  scrollToTop: {
    position: 'absolute' as const,
    right: 16,
    bottom: 20,
    backgroundColor: '#FF8C42',
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