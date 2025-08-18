// src/styles/adminUsers.styles.ts
import { StyleSheet } from 'react-native';

export const colors = {
  churchOrange: "#FF8C42", // Main orange
  churchDark: "#5A2D0C",   // Dark brown
  churchLight: "#FFF5E6",  // Cream background
  churchAccent: "#FFD580", // Accent yellow-orange
  white: "#FFFFFF",
  danger: "#b33a3a",
  textSecondary: "#333333",
  border: "#e0e0e0",
  shadow: "#000000",
  success: "#28a745",
  warning: "#ffc107",
  info: "#007bff",
  placeholder: "#888888",
};

export const styles = StyleSheet.create({
  // Main container styles
  mainContainer: {
    flex: 1,
    backgroundColor: colors.churchLight,
  },

  contentContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },

  container: {
    flex: 1,
    backgroundColor: colors.churchLight,
    padding: 16,
  },

  // Sticky header
  stickyHeader: {
    backgroundColor: colors.white,
    zIndex: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },

  // Title styles
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.churchDark,
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.churchDark,
    marginBottom: 16,
  },

  // Search box styles
  searchBox: {
    marginBottom: 16,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  searchInput: {
    padding: 12,
    width: 300,
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    color: colors.textSecondary,
    fontSize: 16,
  },

  searchButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.churchOrange,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },

  placeholderColor: {
    color: colors.placeholder,
  },

  // Controls container
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },

  // Scroll progress
  scrollProgress: {
    height: 4,
    backgroundColor: colors.border,
    width: '100%',
  },

  scrollProgressBar: {
    height: '100%',
    backgroundColor: colors.churchOrange,
  },

  // Scroll buttons
  scrollButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  scrollButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.churchAccent,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },

  scrollButtonText: {
    color: colors.churchDark,
    fontSize: 12,
    fontWeight: '600',
  },

  scrollButtonTextDisabled: {
    color: colors.placeholder,
  },

  // Info container
  infoContainer: {
    marginLeft: 'auto',
  },

  infoText: {
    fontSize: 12,
    color: colors.placeholder,
  },

  // Error styles
  errorContainer: {
    backgroundColor: '#fee',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcc',
  },

  errorText: {
    color: colors.danger,
    fontSize: 16,
  },

  // Loading text
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },

  noUsersText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },

  noUsersContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card styles (Mobile)
  cardList: {
    gap: 16,
  },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cardField: {
    marginBottom: 12,
  },

  cardFieldLabel: {
    fontWeight: 'bold',
    color: colors.churchDark,
    fontSize: 14,
    marginBottom: 4,
  },

  cardFieldValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  cardActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },

  // Table styles (Desktop)
  tableContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.churchLight,
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.churchOrange,
  },

  tableHeaderText: {
    fontWeight: 'bold',
    color: colors.churchDark,
    fontSize: 14,
  },

  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    minHeight: 60,
  },

  tableCellText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  tableCellContainer: {
    justifyContent: 'center',
  },

  // Column widths
  nameColumn: {
    flex: 2,
  },

  emailColumn: {
    flex: 3,
  },

  roleColumn: {
    flex: 2,
  },

  actionsColumn: {
    flex: 3,
  },

  tableActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  // Role selector
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: colors.churchLight,
    borderRadius: 8,
    padding: 2,
    marginTop: 4,
  },

  roleOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },

  roleOptionSelected: {
    backgroundColor: colors.churchOrange,
  },

  roleOptionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  roleOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },

  // Action buttons
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },

  actionButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },

  updateButton: {
    backgroundColor: colors.info,
  },

  suspendButton: {
    backgroundColor: colors.warning,
  },

  deleteButton: {
    backgroundColor: colors.danger,
  },
});