import React from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Colors matching the temple screen
const colors = {
  churchOrange: "#FF8C42",
  churchDark: "#5A2D0C",
  churchLight: "#FFF5E6",
  churchAccent: "#FFD580",
  white: "#FFFFFF",
  textSecondary: "#333333",
  border: "#e0e0e0",
  shadow: "#000000",
};

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

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.churchOrange} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Ionicons name="people-outline" size={32} color={colors.churchOrange} />
            <Text style={styles.headerText}>About BBT-Africa</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Spreading Sacred Knowledge Across Africa</Text>
          <Text style={styles.heroSubtitle}>
            Connecting devotees with timeless spiritual wisdom through the teachings of Srila Prabhupada
          </Text>
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart-outline" size={24} color={colors.churchOrange} />
            <Text style={styles.sectionTitle}>Our Mission</Text>
          </View>
          <Text style={styles.sectionText}>
            BBT-Africa is dedicated to making spiritual knowledge accessible across the African continent. 
            We facilitate the distribution of sacred books, connect devotees through reading clubs, and 
            create opportunities for spiritual growth and community building.
          </Text>
        </View>

        {/* Vision Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={24} color={colors.churchOrange} />
            <Text style={styles.sectionTitle}>Our Vision</Text>
          </View>
          <Text style={styles.sectionText}>
            To establish a thriving spiritual community across South Africa's major centers, 
            where devotees can easily access sacred literature, participate in meaningful discussions, 
            and grow together in Krishna consciousness.
          </Text>
        </View>

        {/* What We Do Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="library-outline" size={24} color={colors.churchOrange} />
            <Text style={styles.sectionTitle}>What We Do</Text>
          </View>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="book-outline" size={20} color={colors.churchOrange} />
              <Text style={styles.featureText}>Distribute sacred books and literature</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people-outline" size={20} color={colors.churchOrange} />
              <Text style={styles.featureText}>Organize reading clubs and study groups</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="calendar-outline" size={20} color={colors.churchOrange} />
              <Text style={styles.featureText}>Host book distribution events</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="school-outline" size={20} color={colors.churchOrange} />
              <Text style={styles.featureText}>Connect with School of Bhakti content</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="trophy-outline" size={20} color={colors.churchOrange} />
              <Text style={styles.featureText}>Track spiritual progress through log book points</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="globe-outline" size={20} color={colors.churchOrange} />
              <Text style={styles.featureText}>Provide access to BBT Media digital library</Text>
            </View>
          </View>
        </View>

        {/* Our Journey Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map-outline" size={24} color={colors.churchOrange} />
            <Text style={styles.sectionTitle}>Our Journey</Text>
          </View>
          <View style={styles.journeyContainer}>
            <View style={styles.journeyItem}>
              <View style={styles.journeyDot}></View>
              <View style={styles.journeyContent}>
                <Text style={styles.journeyTitle}>Version 1 Development</Text>
                <Text style={styles.journeyDate}>August - September 2025</Text>
                <Text style={styles.journeyText}>
                  Launching our foundational features including reading clubs, event management, 
                  and BBT Media integration across 5 major centers in South Africa.
                </Text>
              </View>
            </View>
            
            <View style={styles.journeyItem}>
              <View style={styles.journeyDot}></View>
              <View style={styles.journeyContent}>
                <Text style={styles.journeyTitle}>Community Expansion</Text>
                <Text style={styles.journeyDate}>Post-Launch</Text>
                <Text style={styles.journeyText}>
                  Expanding our reach through user feedback, enhanced features, and connecting 
                  with School of Bhakti for richer content sharing experiences.
                </Text>
              </View>
            </View>

            <View style={styles.journeyItem}>
              <View style={styles.journeyDot}></View>
              <View style={styles.journeyContent}>
                <Text style={styles.journeyTitle}>Future Vision</Text>
                <Text style={styles.journeyDate}>Version 2+</Text>
                <Text style={styles.journeyText}>
                  Implementing local book sales, advanced admin features, and comprehensive 
                  content management by our national team.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Special Dedication */}
        <View style={styles.dedicationSection}>
          <View style={styles.dedicationCard}>
            <Ionicons name="star-outline" size={28} color={colors.churchOrange} />
            <Text style={styles.dedicationTitle}>Special Dedication</Text>
            <Text style={styles.dedicationText}>
              This app is being developed with the goal of offering it to Srila Prabhupada 
              on his appearance day, as a humble service to spread his teachings across Africa.
            </Text>
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-circle-outline" size={24} color={colors.churchOrange} />
            <Text style={styles.sectionTitle}>Our Team</Text>
          </View>
          <Text style={styles.sectionText}>
            BBT-Africa is managed by dedicated devotees across South Africa's major spiritual centers, 
            with administrative support from a committed national team. Our development is guided by 
            Rathi Sewsunker and supported by devoted servants like Radha Damodar Das.
          </Text>
        </View>

        {/* Coverage Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={24} color={colors.churchOrange} />
            <Text style={styles.sectionTitle}>Our Coverage</Text>
          </View>
          <Text style={styles.sectionText}>
            Currently serving the major spiritual centers across South Africa, with plans to expand 
            throughout the African continent. Our admin network ensures local support and community 
            connection in each region.
          </Text>
        </View>

        {/* External Links Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link-outline" size={24} color={colors.churchOrange} />
            <Text style={styles.sectionTitle}>Connect With Us</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => handleExternalLink('https://bbtmedia.com/ebook/en_iy/')}
          >
            <Ionicons name="library-outline" size={20} color={colors.white} />
            <Text style={styles.linkButtonText}>Visit BBT Media</Text>
            <Ionicons name="open-outline" size={16} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButtonSecondary}
            onPress={handleEmailContact}
          >
            <Ionicons name="mail-outline" size={20} color={colors.churchOrange} />
            <Text style={styles.linkButtonSecondaryText}>Contact Us</Text>
            <Ionicons name="arrow-forward-outline" size={16} color={colors.churchOrange} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Hare Krishna! 🙏
          </Text>
          <Text style={styles.footerSubText}>
            Your servant in spreading Krishna consciousness across Africa
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.churchLight,
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  header: {
    padding: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.churchLight,
  },
  
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginLeft: 12,
    color: colors.churchDark,
  },
  
  heroSection: {
    backgroundColor: colors.white,
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.churchOrange,
  },
  
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.churchDark,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width - 64,
  },
  
  section: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 24,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.churchDark,
    marginLeft: 12,
  },
  
  sectionText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  
  featuresList: {
    gap: 16,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  featureText: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  
  journeyContainer: {
    gap: 24,
  },
  
  journeyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  
  journeyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.churchOrange,
    marginTop: 6,
  },
  
  journeyContent: {
    flex: 1,
  },
  
  journeyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.churchDark,
    marginBottom: 4,
  },
  
  journeyDate: {
    fontSize: 14,
    color: colors.churchOrange,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  journeyText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  
  dedicationSection: {
    margin: 16,
  },
  
  dedicationCard: {
    backgroundColor: colors.churchAccent,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.churchOrange,
  },
  
  dedicationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.churchDark,
    marginVertical: 12,
    textAlign: 'center',
  },
  
  dedicationText: {
    fontSize: 16,
    color: colors.churchDark,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.churchOrange,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    gap: 12,
  },
  
  linkButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  
  linkButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.churchOrange,
    gap: 12,
  },
  
  linkButtonSecondaryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.churchOrange,
  },
  
  footer: {
    backgroundColor: colors.churchDark,
    padding: 32,
    alignItems: 'center',
    marginTop: 24,
  },
  
  footerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  
  footerSubText: {
    fontSize: 14,
    color: colors.churchAccent,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});