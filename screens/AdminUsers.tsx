import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useScrollable } from "../services/ScrollableService";
import { enhancedContainerStyles } from "../services/ScrollableService.css";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseCo";
import { User } from "../models/user.model";
import UserService from "../services/userService";
import { styles } from "../css/adminUsers.styles";

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

  /** Check if mobile view */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /** Fetch users */
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
    <ScrollView ref={scrollViewRef} style={[enhancedContainerStyles, styles.mainContainer]}>
      {isScrollable && (
        <View style={styles.scrollProgress}>
          <View
            style={[styles.scrollProgressBar, { width: `${scrollPercentage}%` }]}
          />
        </View>
      )}

      <View style={styles.contentContainer}>
        <View style={styles.stickyHeader}>
          <Text style={styles.title}>Admin Users</Text>
          
          {/* Search Box */}
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search by name or email..."
              value={searchInput}
              onChangeText={setSearchInput}
              style={styles.searchInput}
              placeholderTextColor={styles.placeholderColor.color}
            />
            <TouchableOpacity 
              onPress={() => setSearchTerm(searchInput)} 
              style={styles.searchButton}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.controlsContainer}>
            {isScrollable && (
              <View style={styles.scrollButtonsContainer}>
                <TouchableOpacity
                  style={[styles.scrollButton, isAtTop && styles.scrollButtonDisabled]}
                  onPress={scrollToTop}
                  disabled={isAtTop}
                >
                  <Text style={[styles.scrollButtonText, isAtTop && styles.scrollButtonTextDisabled]}>
                    ↑ Top
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.scrollButton, isAtBottom && styles.scrollButtonDisabled]}
                  onPress={scrollToBottom}
                  disabled={isAtBottom}
                >
                  <Text style={[styles.scrollButtonText, isAtBottom && styles.scrollButtonTextDisabled]}>
                    ↓ Bottom
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Users: {users.length} | Scroll: {Math.round(scrollPercentage)}% | Pos:{" "}
                {Math.round(scrollPosition)}px
                {isScrollable && (
                  <>
                    {isAtTop && " | At Top"}
                    {isAtBottom && " | At Bottom"}
                  </>
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.container}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.subtitle}>Manage Users</Text>

          {loading ? (
            <Text style={styles.loadingText}>Loading users...</Text>
          ) : isMobile ? (
            /** MOBILE VIEW - CARDS */
            <View style={styles.cardList}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <View key={user.uid} style={styles.card}>
                    <View style={styles.cardField}>
                      <Text style={styles.cardFieldLabel}>Name:</Text>
                      <Text style={styles.cardFieldValue}>{user.displayName}</Text>
                    </View>
                    <View style={styles.cardField}>
                      <Text style={styles.cardFieldLabel}>Email:</Text>
                      <Text style={styles.cardFieldValue}>{user.email}</Text>
                    </View>
                    <View style={styles.cardField}>
                      <Text style={styles.cardFieldLabel}>Role:</Text>
                      <RoleSelector uid={user.uid} currentRole={user.role} />
                    </View>
                    <View style={styles.cardActionsContainer}>
                      <TouchableOpacity
                        onPress={() => handleRoleChange(user.uid)}
                        style={[styles.actionButton, styles.updateButton]}
                      >
                        <Text style={styles.actionButtonText}>Update Role</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleSuspendUser(user.uid)}
                        style={[styles.actionButton, styles.suspendButton]}
                      >
                        <Text style={styles.actionButtonText}>Suspend</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteUser(user.uid)}
                        style={[styles.actionButton, styles.deleteButton]}
                      >
                        <Text style={styles.actionButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noUsersText}>No users found.</Text>
              )}
            </View>
          ) : (
            /** DESKTOP VIEW - TABLE-LIKE CARDS */
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
                <Text style={[styles.tableHeaderText, styles.emailColumn]}>Email</Text>
                <Text style={[styles.tableHeaderText, styles.roleColumn]}>Role</Text>
                <Text style={[styles.tableHeaderText, styles.actionsColumn]}>Actions</Text>
              </View>

              {/* Table Body */}
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <View key={user.uid} style={styles.tableRow}>
                    <Text style={[styles.tableCellText, styles.nameColumn]}>{user.displayName}</Text>
                    <Text style={[styles.tableCellText, styles.emailColumn]}>{user.email}</Text>
                    <View style={[styles.tableCellContainer, styles.roleColumn]}>
                      <RoleSelector uid={user.uid} currentRole={user.role} />
                    </View>
                    <View style={[styles.tableCellContainer, styles.actionsColumn]}>
                      <View style={styles.tableActionsContainer}>
                        <TouchableOpacity
                          onPress={() => handleRoleChange(user.uid)}
                          style={[styles.actionButton, styles.updateButton]}
                        >
                          <Text style={styles.actionButtonText}>Update Role</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleSuspendUser(user.uid)}
                          style={[styles.actionButton, styles.suspendButton]}
                        >
                          <Text style={styles.actionButtonText}>Suspend</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteUser(user.uid)}
                          style={[styles.actionButton, styles.deleteButton]}
                        >
                          <Text style={styles.actionButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noUsersContainer}>
                  <Text style={styles.noUsersText}>No users found.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default AdminUsers;