import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import TempleService, { Temple, Region } from '../services/TempleService';
import { auth } from '../firebaseCo';

const { width } = Dimensions.get('window');

// Colors and styles
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
  const flatListRef = useRef<FlatList<Temple>>(null);
  
  // Scroll state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  
  // Data state
  const [temples, setTemples] = useState<Temple[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // User
  const userId = auth.currentUser?.uid;

  // Load data
  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const [templesData, regionsData] = await Promise.all([
        TempleService.getTemples(),
        TempleService.getRegions()
      ]);

      setTemples(templesData);
      setRegions(regionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load temples data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Scroll functions
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
    
    const threshold = 50;
    setIsAtTop(currentScrollPosition < threshold);
    setIsAtBottom(
      currentScrollPosition > contentSize.height - layoutMeasurement.height - threshold
    );
  };

  // Search functionality
  const filteredTemples = useMemo(() => {
    if (!searchTerm.trim()) {
      return temples;
    }
    return TempleService.searchTemples(temples, searchTerm);
  }, [temples, searchTerm]);

  const handleSearch = () => {
    setIsSearchActive(true);
    scrollToTop();
  };

  const handleReset = () => {
    setSearchTerm('');
    setIsSearchActive(false);
    scrollToTop();
  };

  // Helper functions
  const getRegionName = (regionId: string): string => {
    const region = regions.find(r => r.id === regionId);
    return region?.name || 'Unknown Region';
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render temple item
  const renderTemple = ({ item }: { item: Temple }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      
      {item.description && (
        <Text style={styles.cardText}>{item.description}</Text>
      )}
      
      <Text style={styles.cardText}>
        <Text style={styles.cardLabel}>🏛️ Region: </Text>
        {item.regionName || getRegionName(item.regionId)}
      </Text>
      
      <Text style={styles.cardText}>
        <Text style={styles.cardLabel}>📅 Created: </Text>
        {formatTimestamp(item.createdAt)}
      </Text>
      
      {item.updatedAt && (
        <Text style={styles.cardText}>
          <Text style={styles.cardLabel}>✏️ Updated: </Text>
          {formatTimestamp(item.updatedAt)}
        </Text>
      )}
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.churchOrange} />
          <Text style={styles.loadingText}>Loading temples...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="library-outline" size={32} color={colors.churchOrange} />
        <Text style={styles.headerText}>Temples</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search temples by name, description, or region..."
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
            style={[
              styles.searchButton, 
              searchTerm.trim().length === 0 && styles.disabledButton
            ]} 
            onPress={handleSearch}
            disabled={searchTerm.trim().length === 0}
          >
            <Ionicons name="search" size={16} color="white" />
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.resetButton, 
              searchTerm.length === 0 && styles.disabledButton
            ]} 
            onPress={handleReset}
            disabled={searchTerm.length === 0}
          >
            <Ionicons name="refresh" size={16} color={colors.churchOrange} />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Info */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {searchTerm.trim() ? 
            `Found ${filteredTemples.length} temple${filteredTemples.length !== 1 ? 's' : ''} for "${searchTerm}"` :
            `Showing all ${temples.length} temples`
          }
        </Text>
        {contentHeight > scrollViewHeight && (
          <Text style={styles.scrollInfo}>
            {Math.round((scrollPosition / (contentHeight - scrollViewHeight)) * 100) || 0}% scrolled
          </Text>
        )}
      </View>

      {/* Temples List */}
      <FlatList
        ref={flatListRef}
        data={filteredTemples}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshing={refreshing}
        onRefresh={() => loadData(true)}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchTerm.trim() ? 
                'No temples found matching your search' : 
                'No temples available'
              }
            </Text>
            {searchTerm.trim() && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleReset}>
                <Text style={styles.emptyButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        renderItem={renderTemple}
      />

      {/* Scroll Controls */}
      {contentHeight > scrollViewHeight && !isAtTop && (
        <TouchableOpacity style={styles.scrollToTop} onPress={scrollToTop}>
          <Ionicons name="chevron-up" size={24} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.churchLight,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  
  header: {
    padding: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    color: colors.churchDark,
  },
  
  searchContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.churchLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.churchAccent,
  },
  
  searchIcon: {
    marginRight: 8,
  },
  
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  
  clearButton: {
    padding: 4,
  },
  
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.churchOrange,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.churchOrange,
    gap: 6,
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
  searchButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  
  resetButtonText: {
    color: colors.churchOrange,
    fontWeight: '600',
    fontSize: 14,
  },
  
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.churchLight,
  },
  
  resultsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  
  scrollInfo: {
    fontSize: 12,
    color: '#888',
  },
  
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderTopWidth: 4,
    borderTopColor: colors.churchOrange,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.churchDark,
    marginBottom: 8,
  },
  
  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
  
  cardLabel: {
    fontWeight: 'bold',
    color: colors.churchDark,
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    maxWidth: 280,
  },
  
  emptyButton: {
    backgroundColor: colors.churchOrange,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  
  emptyButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  
  scrollToTop: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.churchOrange,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});