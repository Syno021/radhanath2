import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isMobile = width < 600;

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userInitials: {
    backgroundColor: '#FF8C42',
    color: '#fff',
    borderRadius: 50,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
    fontWeight: 'bold',
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#FFF5E6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: isMobile ? '48%' : '20%', // ✅ mobile = 2 per row
    height: isMobile ? 120 : 180,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
    transitionDuration: '0.3s',
  },
  manageCard: {
    backgroundColor: '#FFF5E6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: isMobile ? '100%' : '85%',
    height: isMobile ? 100 : 150,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardText: {
    fontSize: isMobile ? 14 : 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
