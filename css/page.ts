// styles/rnPageStyles.ts
import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

export const colors = {
  churchOrange: "#FF8C42", // Main orange
  churchDark: "#5A2D0C",   // Dark brown
  churchLight: "#FFF5E6",  // Cream background
  churchAccent: "#FFD580", // Accent yellow-orange
  white: "#FFFFFF",
  danger: "#b33a3a",
  textSecondary: "#333333", // Added this color
  border: "#e0e0e0",
  shadow: "#000000",
};

export const rnPageStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.churchLight,
  },
  
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  stickyHeader: {
    backgroundColor: colors.white,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },

  pickerContainerFixed: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      backgroundColor: '#fff',
      marginBottom: 16,
      // Fix height issues
      minHeight: Platform.OS === 'android' ? 50 : 'auto',
      overflow: 'hidden',
    },
    pickerFixed: {
      // Android specific fixes
      ...(Platform.OS === 'android' && {
        backgroundColor: 'transparent',
        color: '#333',
        height: 50,
      }),
      // iOS specific fixes
      ...(Platform.OS === 'ios' && {
        backgroundColor: 'transparent',
        color: '#333',
      }),
    },

  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.churchDark,
    borderBottomWidth: 4,
    borderBottomColor: colors.churchOrange,
    paddingBottom: 8,
    marginBottom: 16,
    textAlign: 'center',
  },

  searchContainer: {
    marginBottom: 16,
  },

  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.churchAccent,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },

  searchButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  statusContainer: {
    alignItems: 'flex-end',
  },

  statusText: {
    fontSize: 12,
    color: '#888',
  },

  // Add the missing textSecondary style
  textSecondary: {
    color: colors.textSecondary,
  },

  button: {
    backgroundColor: colors.churchOrange,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },

  buttonSecondary: {
    backgroundColor: colors.churchDark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },

  buttonDanger: {
    backgroundColor: colors.danger,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },

  form: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.churchAccent,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  pickerContainer: {
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.churchDark,
    marginBottom: 4,
  },

  picker: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.churchAccent,
    borderRadius: 6,
    height: 50,
  },

  clubsList: {
    gap: 16,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 5,
    borderTopColor: colors.churchOrange,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.churchDark,
    marginBottom: 8,
  },

  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },

  cardLabel: {
    fontWeight: 'bold',
    color: colors.churchDark,
  },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-start',
  },

  // CustomPicker Styles
  customPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.churchAccent,
    borderRadius: 6,
    padding: 12,
    minHeight: 48,
  },

  customPickerDisabled: {
    backgroundColor: colors.churchLight,
    borderColor: colors.border,
    opacity: 0.7,
  },

  customPickerText: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
  },

  customPickerPlaceholder: {
    color: '#999',
  },

  customPickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  customPickerModalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 15,
  },

  customPickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.churchLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  customPickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.churchDark,
  },

  customPickerCloseButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: colors.white,
  },

  customPickerOptionsList: {
    maxHeight: 400,
  },

  customPickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },

  customPickerSelectedOption: {
    backgroundColor: colors.churchLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.churchOrange,
  },

  customPickerOptionText: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
  },

  customPickerSelectedText: {
    color: colors.churchDark,
    fontWeight: '600',
  },
});