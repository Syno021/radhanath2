import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StatusBar, useWindowDimensions } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../app/navigation/ExploreStack';

type ExploreNavigationProp = NativeStackNavigationProp<ExploreStackParamList, 'Explore'>;

interface ExploreOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  gradient: string[];
  route: string;
  count?: number;
  featured?: boolean;
}

export default function Explore() {
  const navigation = useNavigation<ExploreNavigationProp>();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const userInitials = 'JD';

  const exploreOptions: ExploreOption[] = [
    { 
      id: '1',
      label: 'Sacred Books', 
      description: 'Access Srila Prabhupada\'s complete works',
      icon: 'book-outline', 
      color: '#FF6B00', 
      gradient: ['#FF6B00', '#FF8C42'],
      route: 'Book',
      count: 150,
      featured: true
    },
    { 
      id: '2',
      label: 'Local Regions', 
      description: 'Find devotees and temples near you',
      icon: 'location-outline', 
      color: '#10B981', 
      gradient: ['#10B981', '#34D399'],
      route: 'Regions',
      count: 25
    },
    { 
      id: '3',
      label: 'WhatsApp Groups', 
      description: 'Join active spiritual communities',
      icon: 'chatbubbles-outline', 
      color: '#3B82F6', 
      gradient: ['#3B82F6', '#60A5FA'],
      route: 'Groups',
      count: 42
    },
    { 
      id: '4',
      label: 'Reading Clubs', 
      description: 'Study books with like-minded souls',
      icon: 'library-outline', 
      color: '#8B5CF6', 
      gradient: ['#8B5CF6', '#A78BFA'],
      route: 'Clubs',
      count: 18
    },
    { 
      id: '5',
      label: 'Sacred Temples', 
      description: 'Discover ISKCON temples worldwide',
      icon: 'business-outline', 
      color: '#EC4899', 
      gradient: ['#EC4899', '#F472B6'],
      route: 'Temples',
      count: 67
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
          isTablet && styles.tabletCard
        ]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate({ name: item.route as any, params: undefined })}
      >
        <View style={[styles.cardGradient, { backgroundColor: item.color }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name={item.icon as any} size={isLarge ? 32 : 24} color="#FFFFFF" />
            </View>
            {item.featured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>
          
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, isLarge && styles.featuredTitle]}>
              {item.label}
            </Text>
            <Text style={[styles.cardDescription, isLarge && styles.featuredDescription]}>
              {item.description}
            </Text>
            
            <View style={styles.cardFooter}>
              <View style={styles.countContainer}>
                <Text style={styles.countText}>{item.count}+ available</Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hare Krishna</Text>
          <Text style={styles.headerTitle}>Explore Spiritual Journey</Text>
        </View>
        <View style={styles.profileContainer}>
          <View style={styles.notificationBadge}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={20} color="#666" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.userInitials}>{userInitials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={18} color={action.color} />
              </View>
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Discover & Connect</Text>
        <Text style={styles.sectionSubtitle}>
          Explore books, communities, and spiritual resources
        </Text>

        <View style={styles.exploreGrid}>
          {exploreOptions.map((item, index) => renderExploreCard(item, index))}
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Community Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Active Members</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>150+</Text>
              <Text style={styles.statLabel}>Sacred Books</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>25+</Text>
              <Text style={styles.statLabel}>Regions</Text>
            </View>
          </View>
        </View>

        {/* Inspirational Quote */}
        <View style={styles.quoteSection}>
          <View style={styles.quoteContainer}>
            <Ionicons name="quote" size={24} color="#FF6B00" style={styles.quoteIcon} />
            <Text style={styles.quoteText}>
              "The secret of success is to try always to improve yourself no matter where you are or what your position. Learn all you can."
            </Text>
            <Text style={styles.quoteAuthor}>- Srila Prabhupada</Text>
          </View>
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
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4CC',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBadge: {
    position: 'relative',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
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
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Quick Actions
  quickActionsContainer: {
    paddingVertical: 16,
    backgroundColor: '#FDFCFA',
  },
  quickActionsScroll: {
    marginTop: 12,
  },
  quickActionCard: {
    alignItems: 'center',
    marginLeft: 20,
    minWidth: 70,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Content Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
    marginBottom: 24,
    lineHeight: 20,
  },

  // Explore Grid
  exploreGrid: {
    gap: 16,
  },
  exploreCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    marginBottom: 8,
  },
  featuredCard: {
    marginBottom: 12,
  },
  tabletCard: {
    // Add tablet-specific styles if needed
  },
  cardGradient: {
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  featuredTitle: {
    fontSize: 22,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 16,
  },
  featuredDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countContainer: {
    flex: 1,
  },
  countText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Section
  statsSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B00',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Quote Section
  quoteSection: {
    marginTop: 16,
  },
  quoteContainer: {
    backgroundColor: '#FFF9F5',
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B00',
    position: 'relative',
  },
  quoteIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.3,
  },
  quoteText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '400',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '600',
    textAlign: 'right',
  },
};