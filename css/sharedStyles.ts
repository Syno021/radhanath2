// sharedStyles.ts
import { StyleSheet } from "react-native";

export const colors = {
  churchOrange: "#FF8C42",
  churchDark: "#5A2D0C",
  churchLight: "#FFF5E6",
  churchAccent: "#FFD580",
};

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.churchLight,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    marginBottom: 15,
    borderBottomWidth: 4,
    borderBottomColor: colors.churchOrange,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.churchDark,
    marginLeft: 10,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    borderTopWidth: 5,
    borderTopColor: colors.churchOrange,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.churchDark,
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  button: {
    backgroundColor: colors.churchOrange,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
  },
});
