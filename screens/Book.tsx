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
          source={require('../assets/images/book.jpg')} 
          style={styles.bookImage}
        />
        
        {/* Format Badge */}
        <View style={[styles.formatBadge, { backgroundColor: getFormatColor(book.format) }]}>
          <Text style={styles.formatText}>{book.format || 'PDF'}</Text>
        </View>

        {/* Favorite Badge */}
        {book.isFavorite && (
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart" size={14} color="#FF6B00" />
          </TouchableOpacity>
        )}

        {/* Quick Action Overlay */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="bookmark-outline" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Book Details */}
      <View style={styles.bookDetails}>
        {/* Category */}
        {book.category && (
          <Text style={styles.categoryLabel}>{book.category}</Text>
        )}

        {/* Book ID */}
        {book.id ? (
          <Text style={styles.bookId}>ID: {book.id}</Text>
        ) : null}

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
                size={11}
                color="#FFB800"
              />
            ))}
          </View>
          <Text style={styles.ratingCount}>({book.rating || 0})</Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleReadBook(book.bbtMediaLink)}
        >
          <Ionicons name="book-outline" size={14} color="#FF6B00" />
          <Text style={styles.actionButtonText}>Read Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading Sacred Books...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
      {/* Books Grid with scrolling header and filters */}
      <FlatList
        data={filteredBooks}
        renderItem={renderBookCard}
        keyExtractor={(item) => item.id}
        numColumns={isTablet ? 3 : 2}
        contentContainerStyle={styles.booksList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        columnWrapperStyle={isTablet || !isTablet ? styles.row : null}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Srila Prabhupada's Books</Text>
                <Text style={styles.headerSubtitle}>{books.length} sacred texts available</Text>
              </View>
              <TouchableOpacity style={styles.headerAction}>
                <Ionicons name="heart-outline" size={20} color="#FF6B00" />
              </TouchableOpacity>
            </View>

            {/* Spiritual Quote */}
            <View style={styles.quoteSection}>
              <Text style={styles.quoteText}>
                "Books are the basis. Preach and read."
              </Text>
              <Text style={styles.quoteAuthor}>- Srila Prabhupada</Text>
              <View style={styles.quoteDivider} />
            </View>

            {/* Filters */}
            <View style={styles.filtersSection}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search sacred texts, authors..."
                  placeholderTextColor="#999"
                  value={filters.searchText}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, searchText: text }))}
                />
                {filters.searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, searchText: '' }))}>
                    <Ionicons name="close" size={16} color="#999" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Pills - Stacked Layout */}
              <View style={styles.filtersContainer}>
                {/* First Row */}
                <View style={styles.filtersRow}>
                  {/* Category Filter */}
                  <View style={[styles.filterPill, styles.filterPillFlex]}>
                    <Ionicons name="library-outline" size={12} color="#FF6B00" />
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
                  <View style={[styles.filterPill, styles.filterPillFlex]}>
                    <Ionicons name="language-outline" size={12} color="#FF6B00" />
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
                </View>

                {/* Second Row */}
                <View style={styles.filtersRow}>
                  {/* Format Filter */}
                  <View style={[styles.filterPill, styles.filterPillFlex]}>
                    <Ionicons name="document-outline" size={12} color="#FF6B00" />
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
                  {(filters.category || filters.language || filters.format) ? (
                    <TouchableOpacity style={[styles.clearAllPill, styles.filterPillFlex]} onPress={clearAllFilters}>
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                      <Text style={styles.clearAllText}>Clear All</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.filterPill, styles.filterPillFlex, styles.placeholderPill]}>
                      <Ionicons name="options-outline" size={12} color="#CCC" />
                      <Text style={styles.placeholderText}>More Filters</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Results Header */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {filteredBooks.length} Sacred Texts
              </Text>
              <TouchableOpacity style={styles.sortButton}>
                <Text style={styles.sortText}>Sort by Title</Text>
                <Ionicons name="chevron-down" size={14} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>📚</Text>
            </View>
            <Text style={styles.emptyTitle}>No books found</Text>
            <Text style={styles.emptyMessage}>
              Try adjusting your search or filter criteria{'\n'}
              to find the spiritual texts you're looking for
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
    backgroundColor: '#FDFCFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFCFA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '300',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA',
  },
  headerContent: {
    flex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '300',
    marginTop: 2,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },

  // Quote Section
  quoteSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#FDFCFA',
  },
  quoteText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '300',
    fontStyle: 'italic',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  quoteAuthor: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    fontWeight: '400',
  },
  quoteDivider: {
    width: 30,
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 12,
  },

  // Filters Section
  filtersSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filtersContainer: {
    gap: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFCFA',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 8,
    fontWeight: '300',
  },
  filtersRow: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFCFA',
    borderRadius: 20,
    paddingLeft: 12,
    height: 32,
    minWidth: 90,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  filterPillFlex: {
    flex: 1,
  },
  pillPicker: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '400',
    marginLeft: 4,
  },
  clearAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 32,
    gap: 4,
  },
  clearAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  placeholderPill: {
    backgroundColor: '#FAFAFA',
    borderColor: '#EEEEEE',
  },
  placeholderText: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '400',
    marginLeft: 4,
  },

  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '300',
  },

  // Books List
  booksList: {
    padding: 24,
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
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F8F8F8',
  },

  // Book Card Image
  imageContainer: {
    position: 'relative',
  },
  bookImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
    opacity: 0.9,
  },
  formatBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  formatText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  quickActionButton: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Book Details
  bookDetails: {
    padding: 16,
  },
  categoryLabel: {
    fontSize: 9,
    color: '#FF6B00',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bookId: {
    fontSize: 10,
    color: '#999',
    fontWeight: '300',
    marginBottom: 4,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    lineHeight: 18,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  bookAuthor: {
    fontSize: 11,
    color: '#666',
    fontWeight: '300',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingCount: {
    fontSize: 10,
    color: '#999',
    fontWeight: '300',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  actionButtonText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF4E6',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  emptyMessage: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
    fontWeight: '300',
  },
  emptyAction: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});