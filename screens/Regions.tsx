import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useHotReload } from '../services/ScrollableService';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { getRegions } from '../services/regionService';
import { Region } from '../models/region.model';
import { sharedStyles, colors } from '../css/sharedStyles';

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
        <View style={searchStyles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#ccc" />
          <Text style={searchStyles.emptyText}>
            No regions found for "{searchTerm}"
          </Text>
          <TouchableOpacity style={searchStyles.emptyButton} onPress={handleReset}>
            <Text style={searchStyles.emptyButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <Text style={[sharedStyles.cardText, { textAlign: "center", marginTop: 20 }]}>
        No regions found.
      </Text>
    );
  };

  return (
    <SafeAreaView style={sharedStyles.container}>
      <View style={sharedStyles.header}>
        <Ionicons name="map-outline" size={32} color={colors.churchOrange} />
        <Text style={sharedStyles.headerText}>Regions</Text>
      </View>

      {/* Search Section */}
      <View style={searchStyles.searchContainer}>
        <View style={searchStyles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={searchStyles.searchIcon} />
          <TextInput
            style={searchStyles.searchInput}
            placeholder="Search regions by name or description..."
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

      {/* Search Results Info */}
      {searchTerm.trim() && (
        <View style={searchStyles.resultsInfo}>
          <Text style={searchStyles.resultsText}>
            {filteredRegions.length} region{filteredRegions.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.churchOrange} style={{ marginTop: 20 }} />
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={filteredRegions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={sharedStyles.card}>
                <Text style={sharedStyles.cardTitle}>{item.name}</Text>
                {item.description && (
                  <Text style={sharedStyles.cardText}>Description: {item.description}</Text>
                )}
                <Text style={sharedStyles.cardText}>
                  Location: Lat {item.location.latitude}, Lng {item.location.longitude}
                </Text>
                <Text style={sharedStyles.cardText}>
                  Temples: {item.numberoftemples ?? 'N/A'}
                </Text>
                <Text style={sharedStyles.cardText}>
                  WhatsApp Groups: {item.whatsappGroups?.length ?? 0}
                </Text>
                <Text style={sharedStyles.cardText}>
                  Reading Clubs: {item.ReadingClubs?.length ?? 0}
                </Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.churchOrange]} />
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
          
          {/* Scroll to Top Button */}
          {!isAtTop && (
            <TouchableOpacity style={searchStyles.scrollToTop} onPress={scrollToTop}>
              <Ionicons name="arrow-up" size={24} color="white" />
            </TouchableOpacity>
          )}
        </>
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