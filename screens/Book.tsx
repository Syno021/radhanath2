import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
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
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [isFiltersModalVisible, setIsFiltersModalVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterState>({
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

  // Debounce search text for smoother typing and fewer re-renders
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearchText(filters.searchText);
    }, 300);
    return () => clearTimeout(handle);
  }, [filters.searchText]);

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

  const openFiltersModal = () => {
    setTempFilters(filters);
    setIsFiltersModalVisible(true);
  };

  const closeFiltersModal = () => {
    setIsFiltersModalVisible(false);
  };

  const applyFiltersFromModal = () => {
    setFilters((prev) => ({
      ...prev,
      category: tempFilters.category,
      language: tempFilters.language,
      format: tempFilters.format,
    }));
    closeFiltersModal();
  };

  const clearFiltersInModal = () => {
    setTempFilters({ category: '', language: '', format: '', searchText: '' });
  };

  const filteredBooks = useMemo(() => {
    const normalizedSearch = debouncedSearchText.trim().toLowerCase();
    if (!books.length) return [];
    return books.filter((book) => {
      const matchesCategory = !filters.category || book.category === filters.category;
      const matchesLanguage = !filters.language || book.language === filters.language;
      const matchesFormat = !filters.format || book.format === filters.format;
      const matchesSearch = !normalizedSearch ||
        book.title.toLowerCase().includes(normalizedSearch) ||
        book.author.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesLanguage && matchesFormat && matchesSearch;
    });
  }, [books, filters.category, filters.language, filters.format, debouncedSearchText]);

  const getFormatColor = useCallback((format?: string) => {
    switch (format) {
      case 'PDF': return '#FF6B00';
      case 'EPUB': return '#10B981';
      case 'HTML': return '#3B82F6';
      case 'Audio': return '#8B5CF6';
      default: return '#FF6B00';
    }
  }, []);

  const renderBookCard = useCallback(({ item: book }: { item: Book }) => (
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
  ), [cardWidth, handleReadBook, getFormatColor]);

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
        initialNumToRender={8}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        columnWrapperStyle={isTablet ? styles.row : styles.row}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Srila Prabhupada's Books</Text>
                <Text style={styles.headerSubtitle}>{books.length} sacred texts available</Text>
              </View>
              <TouchableOpacity style={styles.headerAction} onPress={openFiltersModal}>
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

            {/* Search */}
            <View style={styles.filtersSection}>
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

      {/* Filters Modal */}
      <Modal
        visible={isFiltersModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeFiltersModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity style={styles.modalClose} onPress={closeFiltersModal}>
                <Ionicons name="close" size={18} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Category</Text>
              <View style={styles.modalPickerRow}>
                <Ionicons name="library-outline" size={14} color="#FF6B00" />
                <Picker
                  selectedValue={tempFilters.category}
                  onValueChange={(value) => setTempFilters(prev => ({ ...prev, category: value }))}
                  style={styles.modalPicker}
                >
                  <Picker.Item label="All" value="" />
                  {categories.map((category) => (
                    <Picker.Item key={category} label={category} value={category} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Language</Text>
              <View style={styles.modalPickerRow}>
                <Ionicons name="language-outline" size={14} color="#FF6B00" />
                <Picker
                  selectedValue={tempFilters.language}
                  onValueChange={(value) => setTempFilters(prev => ({ ...prev, language: value }))}
                  style={styles.modalPicker}
                >
                  <Picker.Item label="All" value="" />
                  {languages.map((language) => (
                    <Picker.Item key={language} label={language} value={language} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Format</Text>
              <View style={styles.modalPickerRow}>
                <Ionicons name="document-outline" size={14} color="#FF6B00" />
                <Picker
                  selectedValue={tempFilters.format}
                  onValueChange={(value) => setTempFilters(prev => ({ ...prev, format: value }))}
                  style={styles.modalPicker}
                >
                  <Picker.Item label="All" value="" />
                  {formats.map((format) => (
                    <Picker.Item key={format} label={format} value={format} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalClearButton} onPress={clearFiltersInModal}>
                <Ionicons name="refresh" size={14} color="#FF6B00" />
                <Text style={styles.modalClearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalApplyButton} onPress={applyFiltersFromModal}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.modalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  modalTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  modalSection: {
    marginTop: 8,
  },
  modalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  modalPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFCFA',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    minHeight: 42,
  },
  modalPicker: {
    flex: 1,
    color: '#1A1A1A',
    marginLeft: 6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  modalClearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  modalClearText: {
    color: '#FF6B00',
    fontSize: 13,
    fontWeight: '600',
  },
  modalApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FF6B00',
  },
  modalApplyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
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