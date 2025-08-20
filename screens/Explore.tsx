import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StatusBar, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../app/navigation/ExploreStack';
import { collection, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebaseCo';

type ExploreNavigationProp = NativeStackNavigationProp<ExploreStackParamList, 'Explore'>;

interface ExploreOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  emoji: string;
  color: string;
  route: string;
  count?: number;
  featured?: boolean;
  collectionName?: string;
}

interface FirebaseStats {
  users: number;
  books: number;
  regions: number;
  temples: number;
  whatsappGroups: number;
  readingClubs: number;
  bookReports: number;
  loading: boolean;
}

export default function Explore() {
  const navigation = useNavigation<ExploreNavigationProp>();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const userInitials = 'JD';

  const [stats, setStats] = useState<FirebaseStats>({
    users: 0,
    books: 0,
    regions: 0,
    temples: 0,
    whatsappGroups: 0,
    readingClubs: 0,
    bookReports: 0,
    loading: true,
  });

  // Fetch real-time statistics from Firestore
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const collections = [
          { name: 'users', key: 'users' },
          { name: 'books', key: 'books' },
          { name: 'regions', key: 'regions' },
          { name: 'temples', key: 'temples' },
          { name: 'whatsapp-groups', key: 'whatsappGroups' },
          { name: 'reading-clubs', key: 'readingClubs' },
          { name: 'bookReports', key: 'bookReports' },
        ];

        const statsPromises = collections.map(async (col) => {
          try {
            const snapshot = await getCountFromServer(collection(db, col.name));
            return { key: col.key, count: snapshot.data().count };
          } catch (error) {
            console.warn(`Error fetching count for ${col.name}:`, error);
            return { key: col.key, count: 0 };
          }
        });

        const results = await Promise.all(statsPromises);
        
        const newStats = { ...stats, loading: false };
        results.forEach(result => {
          newStats[result.key as keyof FirebaseStats] = result.count;
        });

        setStats(newStats);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();

    // Set up real-time listeners for collections that change frequently
    const unsubscribers: (() => void)[] = [];

    // Listen to users collection changes
    const usersUnsub = onSnapshot(
      collection(db, 'users'), 
      () => fetchStats(),
      (error) => console.warn('Users listener error:', error)
    );
    unsubscribers.push(usersUnsub);

    // Listen to book reports collection changes
    const reportsUnsub = onSnapshot(
      collection(db, 'bookReports'), 
      () => fetchStats(),
      (error) => console.warn('Book reports listener error:', error)
    );
    unsubscribers.push(reportsUnsub);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const exploreOptions: ExploreOption[] = [
    { 
      id: '1',
      label: 'Sacred Books', 
      description: 'Access Srila Prabhupada\'s complete works',
      icon: 'book-outline',
      emoji: '📚',
      color: '#FF6B00',
      route: 'Book',
      count: stats.books,
      featured: true,
      collectionName: 'books'
    },
    { 
      id: '2',
      label: 'Local Regions', 
      description: 'Find devotees and temples near you',
      icon: 'location-outline',
      emoji: '🌍',
      color: '#10B981',
      route: 'Regions',
      count: stats.regions,
      collectionName: 'regions'
    },
    { 
      id: '3',
      label: 'WhatsApp Groups', 
      description: 'Join active spiritual communities',
      icon: 'chatbubbles-outline',
      emoji: '👥',
      color: '#3B82F6',
      route: 'Groups',
      count: stats.whatsappGroups,
      collectionName: 'whatsapp-groups'
    },
    { 
      id: '4',
      label: 'Reading Clubs', 
      description: 'Study books with like-minded souls',
      icon: 'library-outline',
      emoji: '📖',
      color: '#8B5CF6',
      route: 'Clubs',
      count: stats.readingClubs,
      collectionName: 'reading-clubs'
    },
    { 
      id: '5',
      label: 'Sacred Temples', 
      description: 'Discover ISKCON temples worldwide',
      icon: 'business-outline',
      emoji: '🏛️',
      color: '#EC4899',
      route: 'Temples',
      count: stats.temples,
      collectionName: 'temples'
    },
  ];

  const quickActions = [
    { label: 'Favorites', icon: 'heart-outline', color: '#FF4757' },
    { label: 'Recent', icon: 'time-outline', color: '#5F27CD' },
    { label: 'Downloads', icon: 'download-outline', color: '#00D2D3' },
    { label: 'Share', icon: 'share-outline', color: '#FF9FF3' },
  ];

  const renderExploreCard = (item: ExploreOption, index: number) => {
    const isLarge = item.featured && index === 0;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.exploreCard,
          isLarge && styles.featuredCard,
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate({ name: item.route as any, params: undefined })}
      >
        <View style={[
          styles.iconContainer, 
          { backgroundColor: item.color + '15' }
        ]}>
          <Text style={styles.cardEmoji}>
            {item.emoji}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            {item.label}
          </Text>
          <Text style={styles.cardDescription}>
            {item.description}
          </Text>
          
          <View style={styles.cardFooter}>
            <Text style={styles.countText}>
              {stats.loading ? 'Loading...' : `${item.count || 0}+ available`}
            </Text>
            <Text style={styles.arrow}>
              →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Calculate additional stats
  const totalCommunityItems = stats.books + stats.regions + stats.whatsappGroups + stats.readingClubs + stats.temples;
  const avgBooksPerUser = stats.users > 0 ? Math.round(stats.bookReports / stats.users) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hare Krishna</Text>
          <Text style={styles.headerTitle}>Explore Spiritual Journey</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.userInitials}>{userInitials}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Connect & Engage
          </Text>
          <View style={styles.divider} />
          <Text style={styles.welcomeSubtitle}>
            Explore books, communities, and spiritual resources
          </Text>
        </View>

        {/* Main Features */}
        <View style={styles.mainSection}>
          <View style={styles.exploreGrid}>
            {exploreOptions.map((item, index) => renderExploreCard(item, index))}
          </View>
        </View>

        {/* Enhanced Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>Live Community Stats</Text>
          {stats.loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B00" />
              <Text style={styles.loadingText}>Loading community statistics...</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.users}+</Text>
                  <Text style={styles.statLabel}>Active Members</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.books}+</Text>
                  <Text style={styles.statLabel}>Sacred Books</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.regions}+</Text>
                  <Text style={styles.statLabel}>Regions</Text>
                </View>
              </View>
              
              {/* Additional Stats Row */}
              <View style={[styles.statsGrid, { marginTop: 12 }]}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.temples}+</Text>
                  <Text style={styles.statLabel}>Temples</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.whatsappGroups}+</Text>
                  <Text style={styles.statLabel}>WhatsApp Groups</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.readingClubs}+</Text>
                  <Text style={styles.statLabel}>Reading Clubs</Text>
                </View>
              </View>

              {/* Engagement Stats */}
              <View style={[styles.statsGrid, { marginTop: 12 }]}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.bookReports}+</Text>
                  <Text style={styles.statLabel}>Book Reports</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{totalCommunityItems}+</Text>
                  <Text style={styles.statLabel}>Total Resources</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{avgBooksPerUser}</Text>
                  <Text style={styles.statLabel}>Avg Books/User</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Inspirational Quote */}
        <View style={styles.quoteSection}>
          <Text style={styles.quoteText}>
            "The secret of success is to try always to improve yourself no matter where you are or what your position. Learn all you can."
          </Text>
          <Text style={styles.quoteAuthor}>
            - Srila Prabhupada
          </Text>
          <View style={styles.quoteDivider} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  
  // Header Styles (simplified like Home page)
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA'
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '300' as const,
    marginTop: 2,
  },
  profileButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF6B00'
  },
  userInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500' as const,
  },

  // Content Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Welcome Section (similar to Home page hero)
  welcomeSection: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center'
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '300' as const,
    color: '#1A1A1A',
    textAlign: 'center' as const,
    lineHeight: 40,
    marginBottom: 12
  },
  divider: {
    width: 50,
    height: 2,
    backgroundColor: '#FF6B00',
    marginBottom: 16
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: 24,
    fontWeight: '300' as const
  },

  // Main Section
  mainSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },

  // Explore Cards (styled like Home page cards)
  exploreGrid: {
    gap: 16,
  },
  exploreCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4
  },
  featuredCard: {
    elevation: 2,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 16
  },
  cardEmoji: {
    fontSize: 18
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500' as const,
    marginBottom: 4
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8
  },
  cardFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  countText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400' as const,
  },
  arrow: {
    color: '#FF6B00',
    fontSize: 18,
    fontWeight: '300' as const
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  statsSectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#1A1A1A',
    marginBottom: 24,
    letterSpacing: 0.3
  },
  loadingContainer: {
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '300',
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
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '500' as const,
    color: '#FF6B00',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '300' as const,
    textAlign: 'center' as const,
  },

  // Quote Section (styled like Home page)
  quoteSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center' as const
  },
  quoteText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    fontWeight: '300' as const,
    fontStyle: 'italic' as const,
    lineHeight: 24,
    letterSpacing: 0.2
  },
  quoteAuthor: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    fontWeight: '400' as const
  },
  quoteDivider: {
    width: 30,
    height: 1,
    backgroundColor: '#DDD',
    marginTop: 16
  },
};