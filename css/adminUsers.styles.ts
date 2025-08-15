// src/styles/adminUsers.styles.ts

export const styles = {
  container: {
    padding: "1rem",
  },
  searchBox: {
    marginBottom: "1rem",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  },
  searchInput: {
    padding: "0.5rem",
    width: "300px",
    maxWidth: "100%",
  },
  searchButton: {
    padding: "0.5rem 1rem",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginTop: "1rem",
    textAlign: "left" as const,
  },
  tableHead: {
    backgroundColor: "#f5f5f5",
  },
  tableCell: {
    border: "1px solid #ccc",
    padding: "8px",
  },
  actionButton: {
    padding: "0.4rem 0.8rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#fff",
  },
  updateButton: {
    backgroundColor: "#007bff",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  cardList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  card: {
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "1rem",
    backgroundColor: "#fff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  cardField: {
    marginBottom: "0.5rem",
  },
};
