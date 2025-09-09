import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseCo";

export default function Dashboard() {
  const [stats, setStats] = useState({
    // Basic stats
    totalUsers: 0,
    totalClubs: 0,
    totalBooks: 0,
    totalRegions: 0,
    totalGroups: 0,
    // Advanced stats
    activeUsers: 0,
    booksThisMonth: 0,
    avgBooksPerClub: 0,
    totalBookPoints: 0,
    activeClubs: 0,
    topRegion: "",
    totalMembers: 0,
    avgMembersPerClub: 0,
    groupsGrowthRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Basic stats queries
      const [users, clubs, booksLibrary, regions, groups, bookReports] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "readingClubs")),
        getDocs(collection(db, "books")),
        getDocs(collection(db, "regions")),
        getDocs(collection(db, "whatsappGroups")),
        getDocs(collection(db, "bookReports")),
      ]);

      // Calculate advanced stats
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const activeUsersQuery = query(
        collection(db, "users"),
        where("lastActive", ">=", firstDayOfMonth)
      );
      const activeUsersSnapshot = await getDocs(activeUsersQuery);

      // Books added to library this month (based on createdAt from AdminAddBooks)
      const booksThisMonthQuery = query(
        collection(db, "books"),
        where("createdAt", ">=", firstDayOfMonth)
      );
      const booksThisMonthSnapshot = await getDocs(booksThisMonthQuery);

      // Calculate totals and averages
      const totalMembers = clubs.docs.reduce(
        (sum, club) => sum + (club.data().members?.length || 0),
        0
      );

      // Aggregate from bookReports for points and total books
      const reportsTotals = bookReports.docs.reduce(
        (acc, docSnap) => {
          const data = docSnap.data() as any;
          return {
            totalBooks: acc.totalBooks + (data.totalBooks || 0),
            totalPoints: acc.totalPoints + (data.totalPoints || 0),
          };
        },
        { totalBooks: 0, totalPoints: 0 }
      );

      // Determine active clubs as those with at least one member
      const activeClubsCount = clubs.docs.filter(
        (doc) => (doc.data().members?.length || 0) > 0
      ).length;

      // Determine top region by number of WhatsApp groups
      let topRegionName = "N/A";
      if (groups.docs.length > 0) {
        const regionCount: Record<string, number> = {};
        groups.docs.forEach((g) => {
          const rid = (g.data() as any).regionId;
          if (rid) {
            regionCount[rid] = (regionCount[rid] || 0) + 1;
          }
        });

        let topRegionId: string | null = null;
        let maxCount = -1;
        Object.entries(regionCount).forEach(([rid, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topRegionId = rid;
          }
        });

        if (topRegionId) {
          const topRegionDoc = regions.docs.find((r) => r.id === topRegionId);
          topRegionName = topRegionDoc?.data().name || topRegionId;
        } else if (regions.docs.length > 0) {
          topRegionName = regions.docs[0].data().name || "N/A";
        }
      } else if (regions.docs.length > 0) {
        topRegionName = regions.docs[0].data().name || "N/A";
      }

      setStats({
        // Basic stats
        totalUsers: users.size,
        totalClubs: clubs.size,
        totalBooks: booksLibrary.size,
        totalRegions: regions.size,
        totalGroups: groups.size,
        // Advanced stats
        activeUsers: activeUsersSnapshot.size,
        booksThisMonth: booksThisMonthSnapshot.size,
        avgBooksPerClub: clubs.size ? Math.round(reportsTotals.totalBooks / clubs.size) : 0,
        totalBookPoints: reportsTotals.totalPoints,
        activeClubs: activeClubsCount,
        topRegion: topRegionName,
        totalMembers,
        avgMembersPerClub:
          clubs.size ? Math.round(totalMembers / clubs.size) : 0,
        groupsGrowthRate: 0, // Calculate based on historical data if available
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  type StatCardProps = {
    icon: string;
    title: string;
    value: number;
    color: string;
    subtitle?: string;
    emoji?: string;
    isWide?: boolean;
  };

  const StatCard: React.FC<StatCardProps> = ({
    icon,
    title,
    value,
    color,
    subtitle = "",
    emoji = "",
    isWide = false,
  }) => (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      width: isWide ? '100%' : '48%',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          width: 36,
          height: 36,
          backgroundColor: '#FFF4E6',
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12
        }}>
          {emoji ? (
            <Text style={{ fontSize: 16 }}>{emoji}</Text>
          ) : (
            <Ionicons size={18} color={color} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 13,
            color: '#666',
            fontWeight: '400',
            letterSpacing: 0.2
          }}>
            {title}
          </Text>
        </View>
      </View>
      <Text style={{
        fontSize: 24,
        fontWeight: '300',
        color: color,
        marginBottom: subtitle ? 4 : 0
      }}>
        {value.toLocaleString()}
      </Text>
      {subtitle && (
        <Text style={{
          fontSize: 12,
          color: '#999',
          fontWeight: '300',
          lineHeight: 16
        }}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFCFA' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FDFCFA'
      }}>
        <View>
          <Text style={{
            fontSize: 22,
            fontWeight: '600',
            color: '#FF6B00',
            letterSpacing: 0.5
          }}>
            Analytics Dashboard
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#999',
            fontWeight: '300',
            marginTop: 2
          }}>
            Temple Community Insights
          </Text>
        </View>
        <View style={{
          paddingHorizontal: 18,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: '#FFF4E6',
          borderWidth: 1,
          borderColor: '#FF6B00'
        }}>
          <Text style={{ color: '#FF6B00', fontSize: 12, fontWeight: '500' }}>
            Live Data
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Welcome Section */}
        <View style={{
          paddingHorizontal: 24,
          paddingVertical: 20,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 26,
            fontWeight: '300',
            color: '#1A1A1A',
            textAlign: 'center',
            lineHeight: 32,
            marginBottom: 12
          }}>
            Temple Community{'\n'}Analytics
          </Text>
          <View style={{
            width: 50,
            height: 2,
            backgroundColor: '#FF6B00',
            marginBottom: 16
          }} />
          <Text style={{
            fontSize: 15,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
            fontWeight: '300'
          }}>
            Track the growth of our spiritual{'\n'}community and book distribution
          </Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator color="#FF6B00" size="large" />
            <Text style={{
              fontSize: 14,
              color: '#999',
              marginTop: 16,
              fontWeight: '300'
            }}>
              Loading community insights...
            </Text>
          </View>
        ) : (
          <>
            {/* Overview Section */}
            <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '400',
                color: '#1A1A1A',
                marginBottom: 20,
                letterSpacing: 0.3
              }}>
                Community Overview
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <StatCard
                    emoji="👥"
                    title="Total Devotees"
                    value={stats.totalUsers}
                    color="#FF6B00"
                    subtitle={`${stats.activeUsers} active this month`} icon={""}                />
                <StatCard
                    emoji="📖"
                    title="Reading Circles"
                    value={stats.totalClubs}
                    color="#4CAF50"
                    subtitle={`${stats.activeClubs} currently active`} icon={""}                />
              </View>

              {/* Special highlight card */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 24,
                marginBottom: 16,
                elevation: 2,
                shadowColor: '#FF6B00',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#FFE4CC'
              }}>
                <View style={{
                  width: 50,
                  height: 50,
                  backgroundColor: '#FFF4E6',
                  borderRadius: 25,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <Text style={{ fontSize: 22 }}>🕉️</Text>
                </View>
                <Text style={{
                  fontSize: 16,
                  color: '#FF6B00',
                  fontWeight: '500',
                  marginBottom: 6
                }}>
                  Spiritual Community Growth
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: '#666',
                  textAlign: 'center',
                  lineHeight: 18
                }}>
                  {stats.totalMembers} devotees connected across {stats.totalRegions} regions
                </Text>
              </View>
            </View>

            {/* Book Distribution Section */}
            <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '400',
                color: '#1A1A1A',
                marginBottom: 20,
                letterSpacing: 0.3
              }}>
                Book Distribution
              </Text>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <StatCard
                    emoji="📚"
                    title="Sacred Books"
                    value={stats.totalBooks}
                    color="#2196F3" icon={""}                />
                <StatCard
                    emoji="⭐"
                    title="Total Points"
                    value={stats.totalBookPoints}
                    color="#9C27B0" icon={""}                />
                <StatCard
                    emoji="📅"
                    title="Books This Month"
                    value={stats.booksThisMonth}
                    color="#FF9800" icon={""}                />
                <StatCard
                    emoji="📊"
                    title="Avg Books/Club"
                    value={stats.avgBooksPerClub}
                    color="#607D8B" icon={""}                />
              </View>
            </View>

            {/* Community Engagement Section */}
            <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '400',
                color: '#1A1A1A',
                marginBottom: 20,
                letterSpacing: 0.3
              }}>
                Community Engagement
              </Text>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <StatCard
                    emoji="🗺️"
                    title="Active Regions"
                    value={stats.totalRegions}
                    color="#00BCD4" icon={""}                />
                <StatCard
                    emoji="🤝"
                    title="Total Members"
                    value={stats.totalMembers}
                    color="#795548" icon={""}                />
                <StatCard
                    emoji="💬"
                    title="WhatsApp Groups"
                    value={stats.totalGroups}
                    color="#25D366" icon={""}                />
                <StatCard
                    emoji="👨‍👩‍👧‍👦"
                    title="Avg Members/Club"
                    value={stats.avgMembersPerClub}
                    color="#FF5722" icon={""}                />
              </View>
            </View>

            {/* Inspirational Info Card */}
            <View style={{
              marginHorizontal: 24,
              backgroundColor: '#FFF9F5',
              padding: 20,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#FFE4CC',
              alignItems: 'center',
              marginBottom: 40
            }}>
              <Text style={{
                fontSize: 14,
                color: '#FF6B00',
                fontWeight: '500',
                marginBottom: 8
              }}>
                📈 Growing Together
              </Text>
              <Text style={{
                fontSize: 13,
                color: '#666',
                textAlign: 'center',
                lineHeight: 18
              }}>
                Our spiritual community continues to expand{'\n'}
                through the power of sacred literature
              </Text>
            </View>

            {/* Spiritual Quote */}
            <View style={{
              paddingHorizontal: 24,
              paddingVertical: 30,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 16,
                color: '#666',
                textAlign: 'center',
                fontWeight: '300',
                fontStyle: 'italic',
                lineHeight: 24,
                letterSpacing: 0.2
              }}>
                "The more you distribute books,{'\n'}the more you advance spiritually."
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#999',
                marginTop: 12,
                fontWeight: '400'
              }}>
                - Srila Prabhupada
              </Text>
              <View style={{
                width: 30,
                height: 1,
                backgroundColor: '#DDD',
                marginTop: 16
              }} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}