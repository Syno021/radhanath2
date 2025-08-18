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
  StatusBar
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

  const filteredBooks = books.filter(book => {
    const matchesCategory = !filters.category || book.category === filters.category;
    const matchesLanguage = !filters.language || book.language === filters.language;
    const matchesFormat = !filters.format || book.format === filters.format;
    const matchesSearch = !filters.searchText || 
      book.title.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      book.author.toLowerCase().includes(filters.searchText.toLowerCase());

    return matchesCategory && matchesLanguage && matchesFormat && matchesSearch;
  });

  const renderBookCard = ({ item: book }: { item: Book }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      activeOpacity={0.9}
      onPress={() => handleReadBook(book.bbtMediaLink)}
    >
      <Image 
        source={require('../assets/images/book.png')} 
        style={styles.bookImage}
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>by {book.author}</Text>
        
        {book.category && (
          <Text style={styles.bookCategory}>{book.category}</Text>
        )}
        
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= (book.rating || 0) ? "star" : "star-outline"}
              size={16}
              color="#FF6B00"
            />
          ))}
          <Text style={styles.ratingText}>{book.rating || 0}/5</Text>
        </View>

        {book.bbtMediaLink && (
          <View style={styles.readButton}>
            <Ionicons name="book-outline" size={16} color="#FFFFFF" />
            <Text style={styles.readButtonText}>Read Now</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
      
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="book-outline" size={32} color="#FF6B00" />
          <Text style={styles.headerText}>Books</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books..."
            placeholderTextColor="#999"
            value={filters.searchText}
            onChangeText={(text) => setFilters(prev => ({ ...prev, searchText: text }))}
          />
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterPicker}>
            <Picker
              selectedValue={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              style={styles.pickerStyle}
            >
              <Picker.Item label="All Categories" value="" />
              {categories.map(category => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
          </View>

          <View style={styles.filterPicker}>
            <Picker
              selectedValue={filters.language}
              onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
              style={styles.pickerStyle}
            >
              <Picker.Item label="All Languages" value="" />
              {languages.map(language => (
                <Picker.Item key={language} label={language} value={language} />
              ))}
            </Picker>
          </View>

          <View style={styles.filterPicker}>
            <Picker
              selectedValue={filters.format}
              onValueChange={(value) => setFilters(prev => ({ ...prev, format: value }))}
              style={styles.pickerStyle}
            >
              <Picker.Item label="All Formats" value="" />
              {formats.map(format => (
                <Picker.Item key={format} label={format} value={format} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredBooks}
        renderItem={renderBookCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.bookGrid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No books found</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDFCFA',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4CC',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 10,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  filtersContainer: {
    paddingHorizontal: 24,
    paddingVertical: 15,
    backgroundColor: '#FDFCFA',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4CC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '300',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterPicker: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerStyle: {
    color: '#666',
    fontWeight: '300',
  },
  bookGrid: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  bookCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  bookImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  bookInfo: {
    padding: 16,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '300',
  },
  bookCategory: {
    fontSize: 12,
    color: '#FF6B00',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
    fontWeight: '400',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontWeight: '300',
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  readButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '300',
  },
});