import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StatusBar, SafeAreaView } from "react-native";
import { useScrollable } from "../services/ScrollableService";
import { enhancedContainerStyles } from "../services/ScrollableService.css";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseCo";
import { User } from "../models/user.model";
import UserService from "../services/userService";
import { Platform, Dimensions } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

const AdminUsers: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    containerRef,
    scrollToTop,
    scrollToBottom,
    scrollToElement,
    scrollToPosition,
    isScrollable,
    scrollPosition,
    scrollPercentage,
    isAtTop,
    isAtBottom,
  } = useScrollable(
    {
      enableSmoothScrolling: true,
      customScrollbarStyles: true,
      preventHorizontalScroll: true,
      scrollThreshold: 50,
      saveScrollPosition: true,
    },
    "admin_users"
  );

  const [users, setUsers] = useState<User[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<{ [key: string]: User["role"] }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const checkMobile = () => setIsMobile(window.innerWidth <= 768);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    } else {
      const subscription = Dimensions.addEventListener('change', ({ window }) => {
        setIsMobile(window.width <= 768);
      });
      
      const { width } = Dimensions.get('window');
      setIsMobile(width <= 768);
      
      return () => subscription?.remove();
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const userList = snapshot.docs.map((doc) => ({
        ...(doc.data() as User),
        uid: doc.id,
      }));
      setUsers(userList);

      const roles: { [key: string]: User["role"] } = {};
      userList.forEach((u) => (roles[u.uid] = u.role));
      setSelectedRole(roles);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    [u.displayName, u.email].join(" ").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (uid: string) => {
    try {
      const role = selectedRole[uid];
      await UserService.updateUserRole(uid, role);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role } : u))
      );
      Alert.alert("Success", "Role updated successfully!");
    } catch (err) {
      console.error("Error updating role:", err);
      setError("Failed to update role.");
    }
  };

  const handleSuspendUser = async (uid: string) => {
    Alert.alert(
      "Confirm Suspension",
      "Are you sure you want to suspend this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Suspend",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "users", uid), { status: "suspended" });
              setUsers((prev) =>
                prev.map((u) => (u.uid === uid ? { ...u, status: "suspended" } : u))
              );
              Alert.alert("Success", "User suspended successfully!");
            } catch (err) {
              console.error("Error suspending user:", err);
              setError("Failed to suspend user.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (uid: string) => {
    Alert.alert(
      "Confirm Deletion",
      "This will permanently delete the user. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", uid));
              setUsers((prev) => prev.filter((u) => u.uid !== uid));
              Alert.alert("Success", "User deleted successfully!");
            } catch (err) {
              console.error("Error deleting user:", err);
              setError("Failed to delete user.");
            }
          },
        },
      ]
    );
  };

  const RoleSelector = ({ uid, currentRole }: { uid: string; currentRole: User["role"] }) => {
    const roleOptions = [
      { label: "User", value: "user" },
      { label: "Facilitator", value: "facilitator" },
      { label: "Admin", value: "admin" },
    ];

    return (
      <View style={styles.roleSelector}>
        {roleOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.roleOption,
              selectedRole[uid] === option.value && styles.roleOptionSelected
            ]}
            onPress={() =>
              setSelectedRole((prev) => ({
                ...prev,
                [uid]: option.value as User["role"],
              }))
            }
          >
            <Text style={[
              styles.roleOptionText,
              selectedRole[uid] === option.value && styles.roleOptionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFCFA" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={styles.headerSubtitle}>Manage community members</Text>
          </View>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{users.length}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{filteredUsers.length}</Text>
              <Text style={styles.statLabel}>Filtered</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              placeholder="Search by name or email..."
              value={searchInput}
              onChangeText={setSearchInput}
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity 
            onPress={() => setSearchTerm(searchInput)} 
            style={styles.searchButton}
            activeOpacity={0.8}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionBtn, isAtTop && styles.quickActionDisabled]}
            onPress={scrollToTop}
            disabled={isAtTop}
          >
            <Ionicons name="arrow-up-outline" size={16} color={isAtTop ? "#CCC" : "#FF6B00"} />
            <Text style={[styles.quickActionText, isAtTop && styles.quickActionTextDisabled]}>
              Top
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionBtn, isAtBottom && styles.quickActionDisabled]}
            onPress={scrollToBottom}
            disabled={isAtBottom}
          >
            <Ionicons name="arrow-down-outline" size={16} color={isAtBottom ? "#CCC" : "#FF6B00"} />
            <Text style={[styles.quickActionText, isAtBottom && styles.quickActionTextDisabled]}>
              Bottom
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={fetchUsers}>
            <Ionicons name="refresh-outline" size={16} color="#FF6B00" />
            <Text style={styles.quickActionText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        {isScrollable && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${scrollPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(scrollPercentage)}%</Text>
          </View>
        )}
      </View>

      <ScrollView 
        ref={scrollViewRef} 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color="#FF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.errorButton} onPress={() => setError(null)}>
              <Text style={styles.errorButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : isMobile ? (
          // Mobile Card View
          <View style={styles.mobileContainer}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <View key={user.uid} style={styles.userCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>
                        {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.displayName}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{user.status || 'active'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.roleSection}>
                      <Text style={styles.sectionLabel}>Current Role</Text>
                      <RoleSelector uid={user.uid} currentRole={user.role} />
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        onPress={() => handleRoleChange(user.uid)}
                        style={styles.primaryAction}
                      >
                        <Ionicons name="checkmark-outline" size={16} color="#FFF" />
                        <Text style={styles.primaryActionText}>Update Role</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.secondaryActions}>
                        <TouchableOpacity
                          onPress={() => handleSuspendUser(user.uid)}
                          style={styles.suspendAction}
                        >
                          <Ionicons name="pause-outline" size={16} color="#FF8800" />
                          <Text style={styles.suspendActionText}>Suspend</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteUser(user.uid)}
                          style={styles.deleteAction}
                        >
                          <Ionicons name="trash-outline" size={16} color="#FF4444" />
                          <Text style={styles.deleteActionText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
              </View>
            )}
          </View>
        ) : (
          // Desktop Table View
          <View style={styles.desktopContainer}>
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.nameColumn]}>User</Text>
                <Text style={[styles.tableHeaderText, styles.emailColumn]}>Contact</Text>
                <Text style={[styles.tableHeaderText, styles.roleColumn]}>Role</Text>
                <Text style={[styles.tableHeaderText, styles.actionsColumn]}>Actions</Text>
              </View>

              {/* Table Body */}
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <View key={user.uid} style={styles.tableRow}>
                    <View style={[styles.tableCell, styles.nameColumn]}>
                      <View style={styles.userAvatarSmall}>
                        <Text style={styles.avatarTextSmall}>
                          {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.tableUserName}>{user.displayName}</Text>
                        <View style={styles.tableStatusBadge}>
                          <Text style={styles.tableStatusText}>{user.status || 'active'}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={[styles.tableCell, styles.emailColumn]}>
                      <Text style={styles.tableCellText}>{user.email}</Text>
                    </View>
                    
                    <View style={[styles.tableCell, styles.roleColumn]}>
                      <RoleSelector uid={user.uid} currentRole={user.role} />
                    </View>
                    
                    <View style={[styles.tableCell, styles.actionsColumn]}>
                      <View style={styles.tableActionsContainer}>
                        <TouchableOpacity
                          onPress={() => handleRoleChange(user.uid)}
                          style={styles.tableAction}
                        >
                          <Ionicons name="checkmark-outline" size={16} color="#FF6B00" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleSuspendUser(user.uid)}
                          style={styles.tableAction}
                        >
                          <Ionicons name="pause-outline" size={16} color="#FF8800" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteUser(user.uid)}
                          style={styles.tableAction}
                        >
                          <Ionicons name="trash-outline" size={16} color="#FF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color="#CCC" />
                  <Text style={styles.emptyText}>No users found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF6B00',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // Search Section
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  searchButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 4,
  },
  quickActionDisabled: {
    opacity: 0.5,
  },
  quickActionText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
  quickActionTextDisabled: {
    color: '#CCC',
  },

  // Progress Bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 35,
    textAlign: 'right',
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },

  // Error Card
  errorCard: {
    backgroundColor: '#FFE8E8',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD0D0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#CC0000',
  },
  errorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF4444',
    borderRadius: 6,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },

  // Loading
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },

  // Mobile View
  mobileContainer: {
    padding: 16,
    gap: 16,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    color: '#2E7D2E',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  cardContent: {
    gap: 16,
  },
  roleSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Role Selector
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roleOptionSelected: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  roleOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
  },

  // Card Actions
  cardActions: {
    gap: 12,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  suspendAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4E6',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF8800',
    gap: 6,
  },
  suspendActionText: {
    color: '#FF8800',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8E8',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4444',
    gap: 6,
  },
  deleteActionText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '500',
  },

  // Desktop Table View
  desktopContainer: {
    padding: 16,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tableCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Column widths
  nameColumn: { flex: 3 },
  emailColumn: { flex: 3 },
  roleColumn: { flex: 2 },
  actionsColumn: { flex: 2 },

  // Table User Info
  userAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTextSmall: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tableUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  tableStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tableStatusText: {
    fontSize: 10,
    color: '#2E7D2E',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Table Actions
  tableActionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tableAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
};

export default AdminUsers;