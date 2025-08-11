import React from "react";
import { ScrollView, View, Text, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../app/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import styles from "../css/homeStyles";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function Home() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { width } = useWindowDimensions();

  const isMobile = width < 600;
  const cardWidth = isMobile ? "48%" : "30%";

  return (
    <View style={{ flex: 1 }}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerBtn, styles.loginBtn]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.headerBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: 70 }} // Space for fixed header
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Welcome to Our Church</Text>
          <Text style={styles.heroSubtitle}>
            Serving communities across South Africa with faith, love, and unity.
          </Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Us</Text>
          <Text style={styles.sectionText}>
            Our church is a vibrant community of believers spread across various
            regions of South Africa. We are dedicated to fostering spiritual
            growth, supporting our members, and engaging in outreach programs.
          </Text>
        </View>

        {/* Temples Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Temples</Text>
          <View style={styles.gridContainer}>
            {[
              { name: "Cape Town Temple", location: "Cape Town, Western Cape" },
              { name: "Johannesburg Temple", location: "Johannesburg, Gauteng" },
              { name: "Durban Temple", location: "Durban, KwaZulu-Natal" },
              { name: "Port Elizabeth Temple", location: "Eastern Cape" },
            ].map((temple, index) => (
              <View key={index} style={[styles.templeCard, { width: cardWidth }]}>
                <Image
                  source={{ uri: "https://via.placeholder.com/150" }}
                  style={styles.templeImage}
                />
                <Text style={styles.templeName}>{temple.name}</Text>
                <Text style={styles.templeLocation}>{temple.location}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Regions Section */}
        <View style={styles.regionsSection}>
          <Text style={styles.sectionTitle}>Regions We Serve</Text>
          <Text style={styles.sectionText}>
            We have active congregations and outreach programs in:
          </Text>
          <View style={styles.regionsList}>
            <Text style={styles.regionItem}>• Western Cape</Text>
            <Text style={styles.regionItem}>• Gauteng</Text>
            <Text style={styles.regionItem}>• KwaZulu-Natal</Text>
            <Text style={styles.regionItem}>• Eastern Cape</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
