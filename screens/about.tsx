import React from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function AboutUsPage() {
  const navigation = useNavigation();

  const handleExternalLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleEmailContact = () => {
    Linking.openURL('mailto:contact@bbtafrica.org');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backBtn} 
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FF6B00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About BBT Africa</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Spreading Sacred Knowledge{'\n'}Across Africa
          </Text>
          <View style={styles.divider} />
          <Text style={styles.heroSubtitle}>
            Connecting devotees with timeless spiritual wisdom{'\n'}through the teachings of Srila Prabhupada
          </Text>
        </View>

        {/* Featured Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop" }}
            style={styles.heroImage}
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageText}>Krishna Consciousness Community</Text>
          </View>
        </View>

        {/* Mission & Vision Cards */}
        <View style={styles.cardSection}>
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Text style={{ fontSize: 20 }}>💖</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Our Mission</Text>
              <Text style={styles.cardText}>
                Making spiritual knowledge accessible across the African continent through book distribution, 
                reading clubs, and community building in Krishna consciousness.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Text style={{ fontSize: 20 }}>👁️</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Our Vision</Text>
              <Text style={styles.cardText}>
                A thriving spiritual community across South Africa's major centers, where devotees 
                access sacred literature and grow together in Krishna consciousness.
              </Text>
            </View>
          </View>
        </View>

        {/* What We Do */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Do</Text>
          <View style={styles.featureGrid}>
            {[
              { icon: "📚", title: "Sacred Literature", desc: "Distribute books and spiritual texts" },
              { icon: "👥", title: "Reading Clubs", desc: "Organize study groups and discussions" },
              { icon: "📅", title: "Events", desc: "Host book distribution gatherings" },
              { icon: "🎓", title: "School Connection", desc: "Link with School of Bhakti content" },
              { icon: "🏆", title: "Progress Tracking", desc: "Monitor spiritual growth journey" },
              { icon: "🌐", title: "Digital Library", desc: "Access BBT Media resources" }
            ].map((item, index) => (
              <View key={index} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{item.icon}</Text>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Journey Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Journey</Text>
          <View style={styles.timeline}>
            {[
              {
                phase: "Launch Phase",
                period: "August - September 2025",
                description: "Launching foundational features across 5 major South African centers with reading clubs and BBT Media integration."
              },
              {
                phase: "Growth Phase",
                period: "Post-Launch",
                description: "Expanding reach through community feedback and enhanced School of Bhakti content integration."
              },
              {
                phase: "Future Vision",
                period: "Version 2+",
                description: "Local book sales, advanced admin features, and comprehensive content management nationwide."
              }
            ].map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelinePhase}>{item.phase}</Text>
                  <Text style={styles.timelinePeriod}>{item.period}</Text>
                  <Text style={styles.timelineDesc}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Special Dedication */}
        <View style={styles.dedicationCard}>
          <Text style={styles.dedicationIcon}>⭐</Text>
          <Text style={styles.dedicationTitle}>Special Dedication</Text>
          <Text style={styles.dedicationText}>
            This app is being developed with the goal of offering it to Srila Prabhupada 
            on his appearance day, as a humble service to spread his teachings across Africa.
          </Text>
        </View>

        {/* Coverage & Team */}
        <View style={styles.cardSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoTitle}>Our Coverage</Text>
            <Text style={styles.infoText}>
              Serving major spiritual centers across South Africa, with expansion plans 
              throughout the African continent through local admin networks.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>👥</Text>
            <Text style={styles.infoTitle}>Our Team</Text>
            <Text style={styles.infoText}>
              Managed by dedicated devotees with administrative support from our national team, 
              guided by Rathi Sewsunker and devoted servants like Radha Damodar Das.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => handleExternalLink('https://bbtmedia.com/ebook/en_iy/')}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Visit BBT Media Library</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleEmailContact}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Contact Our Team</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerQuote}>
            "Books are the basis. Preach and read."
          </Text>
          <Text style={styles.footerAuthor}>- Srila Prabhupada</Text>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Hare Krishna! 🙏</Text>
          <Text style={styles.footerSubText}>
            Your servant in spreading Krishna consciousness across Africa
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FDFCFA' 
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '500', 
    color: '#1A1A1A',
    letterSpacing: 0.3
  },

  // Hero
  hero: { 
    paddingHorizontal: 24, 
    paddingVertical: 30, 
    alignItems: 'center' 
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
    letterSpacing: 0.3
  },
  divider: { 
    width: 50, 
    height: 2, 
    backgroundColor: '#FF6B00', 
    marginBottom: 16 
  },
  heroSubtitle: { 
    fontSize: 15, 
    color: '#666', 
    textAlign: 'center', 
    lineHeight: 22,
    fontWeight: '300'
  },

  // Image
  imageContainer: {
    marginHorizontal: 24,
    marginBottom: 40,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden'
  },
  heroImage: {
    width: '100%',
    height: 180,
    opacity: 0.9
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },
  imageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center'
  },

  // Cards
  cardSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
    gap: 16
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF4E6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  cardContent: {
    flex: 1
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#1A1A1A', 
    marginBottom: 8,
    letterSpacing: 0.2
  },
  cardText: { 
    fontSize: 14, 
    color: '#666', 
    lineHeight: 20,
    fontWeight: '300'
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 40
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#1A1A1A',
    marginBottom: 24,
    letterSpacing: 0.3
  },

  // Features
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center'
  },
  featureDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16
  },

  // Timeline
  timeline: {
    gap: 20
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B00',
    marginRight: 16,
    marginTop: 4
  },
  timelineContent: {
    flex: 1
  },
  timelinePhase: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4
  },
  timelinePeriod: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
    marginBottom: 8
  },
  timelineDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontWeight: '300'
  },

  // Dedication
  dedicationCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFF9F5',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    alignItems: 'center',
    marginBottom: 40
  },
  dedicationIcon: {
    fontSize: 24,
    marginBottom: 12
  },
  dedicationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF6B00',
    marginBottom: 12
  },
  dedicationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '300'
  },

  // Info Cards
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 12
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center'
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '300'
  },

  // Action Buttons
  actionSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
    gap: 12
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.3
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center'
  },
  footerQuote: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '300',
    fontStyle: 'italic',
    lineHeight: 24,
    letterSpacing: 0.2,
    marginBottom: 8
  },
  footerAuthor: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
    marginBottom: 20
  },
  footerDivider: {
    width: 30,
    height: 1,
    backgroundColor: '#DDD',
    marginBottom: 20
  },
  footerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 6
  },
  footerSubText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '300'
  }
});