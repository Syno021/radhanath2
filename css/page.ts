// css/page.ts
import { CSSProperties } from "react";

export const colors = {
  churchOrange: "#FF8C42", // Main orange
  churchDark: "#5A2D0C",   // Dark brown
  churchLight: "#FFF5E6",  // Cream background
  churchAccent: "#FFD580", // Accent yellow-orange
};

export const pageStyles: { [key: string]: CSSProperties } = {
  container: {
    backgroundColor: colors.churchLight,
    minHeight: "100vh",
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: colors.churchDark,
  },

  header: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: colors.churchDark,
    borderBottom: `4px solid ${colors.churchOrange}`,
    paddingBottom: "0.5rem",
    marginBottom: "1.5rem",
    textAlign: "center",
  },

  button: {
    backgroundColor: colors.churchOrange,
    color: "white",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  buttonSecondary: {
    backgroundColor: colors.churchDark,
    color: "white",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  buttonDanger: {
    backgroundColor: "#b33a3a",
    color: "white",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  buttonHover: {
    transform: "scale(1.05)",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
  },

  form: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
    marginTop: "1rem",
  },

  input: {
    width: "100%",
    padding: "0.5rem",
    margin: "0.5rem 0",
    borderRadius: "6px",
    border: `1px solid ${colors.churchAccent}`,
    fontSize: "1rem",
  },

  select: {
    width: "100%",
    padding: "0.5rem",
    margin: "0.5rem 0",
    borderRadius: "6px",
    border: `1px solid ${colors.churchAccent}`,
    fontSize: "1rem",
    backgroundColor: "white",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginTop: "2rem",
  },

  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    padding: "1rem",
    borderTop: `5px solid ${colors.churchOrange}`,
  },

  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    marginBottom: "0.5rem",
    color: colors.churchDark,
  },

  cardText: {
    fontSize: "0.95rem",
    color: "#333",
    marginBottom: "0.5rem",
  },
};
