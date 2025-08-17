import React, { useEffect, useState } from "react";
import { useScrollable } from "../services/ScrollableService";
import { enhancedContainerStyles } from "../services/ScrollableService.css";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseCo";
import { User } from "../models/user.model";
import UserService from "../services/userService";
import { styles } from "../css/adminUsers.styles";

const AdminUsers: React.FC = () => {
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
  const [error, setError] = useState<string | null>(null); // ✅ Added missing error state

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
      alert("Role updated successfully!");
    } catch (err) {
      console.error("Error updating role:", err);
      setError("Failed to update role.");
    }
  };

  const handleSuspendUser = async (uid: string) => {
    if (!window.confirm("Are you sure you want to suspend this user?")) return;
    try {
      await updateDoc(doc(db, "users", uid), { status: "suspended" });
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, status: "suspended" } : u))
      );
      alert("User suspended successfully!");
    } catch (err) {
      console.error("Error suspending user:", err);
      setError("Failed to suspend user.");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("This will permanently delete the user. Continue?")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
      alert("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user.");
    }
  };

  return (
    <div ref={containerRef} style={enhancedContainerStyles}>
      {isScrollable && (
        <div className="scroll-progress">
          <div
            className="scroll-progress-bar"
            style={{ width: `${scrollPercentage}%` }}
          />
        </div>
      )}

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "white",
            zIndex: 10,
            paddingBottom: "1rem",
            borderBottom: "1px solid #e0e0e0",
            marginBottom: "1rem",
          }}
        >
          <h1 >Admin Users</h1> {/* ✅ Fixed title */}
          {/* Search Box */}
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={styles.searchInput}
            />
            <button onClick={() => setSearchTerm(searchInput)} style={styles.searchButton}>
              Search
            </button>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            {isScrollable && (
              <div className="scroll-buttons">
                <button
                  className="scroll-button"
                  onClick={scrollToTop}
                  disabled={isAtTop}
                  title="Scroll to top"
                >
                  ↑ Top
                </button>
                <button
                  className="scroll-button"
                  onClick={scrollToBottom}
                  disabled={isAtBottom}
                  title="Scroll to bottom"
                >
                  ↓ Bottom
                </button>
              </div>
            )}

            <div style={{ fontSize: "0.8rem", color: "#888", marginLeft: "auto" }}>
              Users: {users.length} | Scroll: {Math.round(scrollPercentage)}% | Pos:{" "}
              {Math.round(scrollPosition)}px
              {isScrollable && (
                <>
                  {isAtTop && " | At Top"}
                  {isAtBottom && " | At Bottom"}
                </>
              )}
            </div>
          </div>
        </div>

        <div style={styles.container}>
          {error && (
            <div
              style={{
                color: "red",
                backgroundColor: "#fee",
                padding: "1rem",
                marginBottom: "1rem",
                borderRadius: "4px",
                border: "1px solid #fcc",
              }}
            >
              {error}
            </div>
          )}

          <h2>Manage Users</h2>

          

          {loading ? (
            <p>Loading users...</p>
          ) : isMobile ? (
            /** MOBILE VIEW - CARDS */
            <div style={styles.cardList}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div key={user.uid} style={styles.card}>
                    <div style={styles.cardField}>
                      <strong>Name:</strong> {user.displayName}
                    </div>
                    <div style={styles.cardField}>
                      <strong>Email:</strong> {user.email}
                    </div>
                    <div style={styles.cardField}>
                      <strong>Role:</strong>{" "}
                      <select
                        value={selectedRole[user.uid]}
                        onChange={(e) =>
                          setSelectedRole((prev) => ({
                            ...prev,
                            [user.uid]: e.target.value as User["role"],
                          }))
                        }
                      >
                        <option value="user">User</option>
                        <option value="facilitator">Facilitator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleRoleChange(user.uid)}
                        style={{ ...styles.actionButton, ...styles.updateButton }}
                      >
                        Update Role
                      </button>
                      <button
                        onClick={() => handleSuspendUser(user.uid)}
                        style={{ ...styles.actionButton, backgroundColor: "#ffc107" }}
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.uid)}
                        style={{ ...styles.actionButton, ...styles.deleteButton }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No users found.</p>
              )}
            </div>
          ) : (
            /** DESKTOP VIEW - TABLE */
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.tableCell}>Name</th>
                  <th style={styles.tableCell}>Email</th>
                  <th style={styles.tableCell}>Role</th>
                  <th style={styles.tableCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.uid}>
                      <td style={styles.tableCell}>{user.displayName}</td>
                      <td style={styles.tableCell}>{user.email}</td>
                      <td style={styles.tableCell}>
                        <select
                          value={selectedRole[user.uid]}
                          onChange={(e) =>
                            setSelectedRole((prev) => ({
                              ...prev,
                              [user.uid]: e.target.value as User["role"],
                            }))
                          }
                        >
                          <option value="user">User</option>
                          <option value="facilitator">Facilitator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleRoleChange(user.uid)}
                            style={{ ...styles.actionButton, ...styles.updateButton }}
                          >
                            Update Role
                          </button>
                          <button
                            onClick={() => handleSuspendUser(user.uid)}
                            style={{ ...styles.actionButton, backgroundColor: "#ffc107" }}
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
                            style={{ ...styles.actionButton, ...styles.deleteButton }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: "8px", textAlign: "center" }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
