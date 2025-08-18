import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Image, 
  FlatList, 
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseCo';

interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  publishYear?: number;
  bbtMediaLink?: string;
  category?: string;
  language?: string;
  format?: 'PDF' | 'EPUB' | 'HTML' | 'Audio';
  rating?: number;
  isFavorite?: boolean;
}

interface FilterState {
  category: string;
  language: string;
  format: string;
  searchText: string;
}

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    language: '',
    format: '',
    searchText: ''
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const cardWidth = isTablet ? (width - 60) / 3 : (width - 48) / 2;

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const booksQuery = query(collection(db, 'books'), orderBy('title'));
      const querySnapshot = await getDocs(booksQuery);
      
      const fetchedBooks: Book[] = [];
      const uniqueCategories = new Set<string>();
      const uniqueLanguages = new Set<string>();
      const uniqueFormats = new Set<string>();

      querySnapshot.forEach((doc) => {
        const book = { id: doc.id, ...doc.data() } as Book;
        fetchedBooks.push(book);
        
        if (book.category) uniqueCategories.add(book.category);
        if (book.language) uniqueLanguages.add(book.language);
        if (book.format) uniqueFormats.add(book.format);
      });

      setBooks(fetchedBooks);
      setCategories(Array.from(uniqueCategories));
      setLanguages(Array.from(uniqueLanguages));
      setFormats(Array.from(uniqueFormats));
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadBook = async (bbtMediaLink?: string) => {
    if (bbtMediaLink) {
      try {
        const supported = await Linking.canOpenURL(bbtMediaLink);
        if (supported) {
          await Linking.openURL(bbtMediaLink);
        }
      } catch (error) {
        console.error('Error opening link:', error);
      }
    }
  };

  const clearAllFilters = () => {
    setFilters({
      category: '',
      language: '',
      format: '',
      searchText: ''
    });
  };

  const filteredBooks = books.filter(book => {
    const matchesCategory = !filters.category || book.category === filters.category;
    const matchesLanguage = !filters.language || book.language === filters.language;
    const matchesFormat = !filters.format || book.format === filters.format;
    const matchesSearch = !filters.searchText || 
      book.title.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      book.author.toLowerCase().includes(filters.searchText.toLowerCase());

    return matchesCategory && matchesLanguage && matchesFormat && matchesSearch;
  });

  const getFormatColor = (format?: string) => {
    switch (format) {
      case 'PDF': return '#FF6B00';
      case 'EPUB': return '#10B981';
      case 'HTML': return '#3B82F6';
      case 'Audio': return '#8B5CF6';
      default: return '#FF6B00';
    }
  };

  const renderBookCard = ({ item: book }: { item: Book }) => (
    <TouchableOpacity 
      style={[styles.bookCard, { width: cardWidth }]}
      activeOpacity={0.85}
      onPress={() => handleReadBook(book.bbtMediaLink)}
    >
      {/* Book Image Container */}
      <View style={styles.imageContainer}>
        <Image 
          source={require('../assets/images/book.png')} 
          style={styles.bookImage}
        />
        
        {/* Format Badge */}
        <View style={[styles.formatBadge, { backgroundColor: getFormatColor(book.format) }]}>
          <Text style={styles.formatText}>{book.format || 'PDF'}</Text>
        </View>

        {/* Favorite Badge */}
        {book.isFavorite && (
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart" size={16} color="#FF4757" />
          </TouchableOpacity>
        )}

        {/* Quick Action Overlay */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="bookmark-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Book Details */}
      <View style={styles.bookDetails}>
        {/* Category */}
        {book.category && (
          <Text style={styles.categoryLabel}>{book.category}</Text>
        )}

        {/* Title */}
        <Text style={styles.bookTitle} numberOfLines={2}>
          {book.title}
        </Text>

        {/* Author */}
        <Text style={styles.bookAuthor} numberOfLines={1}>
          by {book.author}
        </Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= (book.rating || 0) ? "star" : "star-outline"}
                size={12}
                color="#FFD700"
              />
            ))}
          </View>
          <Text style={styles.ratingCount}>({book.rating || 0})</Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: getFormatColor(book.format) }]}
          onPress={() => handleReadBook(book.bbtMediaLink)}
        >
          <Ionicons name="download-outline" size={14} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Read Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading Books...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Sacred Books</Text>
            <Text style={styles.headerSubtitle}>{books.length} books available</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="grid-outline" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="heart-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Fixed Filters */}
      <View style={styles.filtersSection}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, authors..."
            placeholderTextColor="#999"
            value={filters.searchText}
            onChangeText={(text) => setFilters(prev => ({ ...prev, searchText: text }))}
          />
          {filters.searchText.length > 0 && (
            <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, searchText: '' }))}>
              <Ionicons name="close" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {/* Category Filter */}
          <View style={styles.filterPill}>
            <Ionicons name="library-outline" size={14} color="#FF6B00" />
            <Picker
              selectedValue={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              style={styles.pillPicker}
            >
              <Picker.Item label="Category" value="" />
              {categories.map(category => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
          </View>

          {/* Language Filter */}
          <View style={styles.filterPill}>
            <Ionicons name="language-outline" size={14} color="#FF6B00" />
            <Picker
              selectedValue={filters.language}
              onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
              style={styles.pillPicker}
            >
              <Picker.Item label="Language" value="" />
              {languages.map(language => (
                <Picker.Item key={language} label={language} value={language} />
              ))}
            </Picker>
          </View>

          {/* Format Filter */}
          <View style={styles.filterPill}>
            <Ionicons name="document-outline" size={14} color="#FF6B00" />
            <Picker
              selectedValue={filters.format}
              onValueChange={(value) => setFilters(prev => ({ ...prev, format: value }))}
              style={styles.pillPicker}
            >
              <Picker.Item label="Format" value="" />
              {formats.map(format => (
                <Picker.Item key={format} label={format} value={format} />
              ))}
            </Picker>
          </View>

          {/* Clear All Filter */}
          {(filters.category || filters.language || filters.format) && (
            <TouchableOpacity style={styles.clearAllPill} onPress={clearAllFilters}>
              <Ionicons name="close" size={14} color="#FFFFFF" />
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredBooks.length} Results
        </Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Sort by</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Books Grid */}
      <FlatList
        data={filteredBooks}
        renderItem={renderBookCard}
        keyExtractor={(item) => item.id}
        numColumns={isTablet ? 3 : 2}
        contentContainerStyle={styles.booksList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        columnWrapperStyle={isTablet || !isTablet ? styles.row : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="book-outline" size={48} color="#E5E5E5" />
            </View>
            <Text style={styles.emptyTitle}>No books found</Text>
            <Text style={styles.emptyMessage}>
              Try adjusting your search or filter criteria
            </Text>
            <TouchableOpacity style={styles.emptyAction} onPress={clearAllFilters}>
              <Text style={styles.emptyActionText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filters Section
  filtersSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  filtersRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingLeft: 12,
    height: 36,
    minWidth: 100,
  },
  pillPicker: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  clearAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
    gap: 4,
  },
  clearAllText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },

  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Books List
  booksList: {
    padding: 16,
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
  },
  bookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },

  // Book Card Image
  imageContainer: {
    position: 'relative',
  },
  bookImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  formatBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  formatText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  quickActionButton: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Book Details
  bookDetails: {
    padding: 12,
  },
  categoryLabel: {
    fontSize: 10,
    color: '#FF6B00',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 18,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAction: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});