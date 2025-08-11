import { StyleSheet } from "react-native";

export default StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  /** HEADER **/
  header: {
  position: "absolute", // Sticks at top
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100, // Keep above other content
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: '#FFF5E6',
  paddingVertical: 15,
  paddingHorizontal: 20,
  borderBottomWidth: 1,
  borderBottomColor: "#ddd",
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 3,
},
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d2d2d",
  },
  headerButtons: {
    flexDirection: "row",
  },
  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginLeft: 8,
  },
  registerBtn: {
    backgroundColor: "#f57c00",
  },
  loginBtn: {
    backgroundColor: "#2d2d2d",
  },
  headerBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  /** HERO **/
  heroSection: {
    alignItems: "center",
    backgroundColor: "#f57c00",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: "serif",
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  heroSubtitle: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    maxWidth: 300,
    lineHeight: 22,
  },

  /** SECTIONS **/
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: "serif",
    fontWeight: "bold",
    color: "#2d2d2d",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 16,
    fontFamily: "sans-serif",
    color: "#555",
    lineHeight: 22,
  },

  /** GRID **/
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  templeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  templeImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
  },
  templeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d2d2d",
    textAlign: "center",
  },
  templeLocation: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },

  /** REGIONS **/
  regionsSection: {
    backgroundColor: "#f4d35e",
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  regionsList: {
    marginTop: 8,
  },
  regionItem: {
    fontSize: 16,
    color: "#2d2d2d",
  },
});
