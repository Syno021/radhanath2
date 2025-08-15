import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseCo";
import { User } from "../models/user.model";
import UserService from "../services/userService";
import { styles } from "../css/adminUsers.styles";

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<{ [key: string]: User["role"] }>({});
  const [isMobile, setIsMobile] = useState(false);

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
    } catch (error) {
      console.error("Error fetching users:", error);
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
    } catch (error) {
      console.error("Error updating role:", error);
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
    } catch (error) {
      console.error("Error suspending user:", error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("This will permanently delete the user. Continue?")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Admin - Manage Users</h1>

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

      {loading ? (
        <p>Loading users...</p>
      ) : isMobile ? (
        /** MOBILE VIEW - CARDS */
        <div style={styles.cardList}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.uid} style={styles.card}>
                <div style={styles.cardField}><strong>Name:</strong> {user.displayName}</div>
                <div style={styles.cardField}><strong>Email:</strong> {user.email}</div>
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
                <td colSpan={5} style={{ padding: "8px", textAlign: "center" }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsers;
