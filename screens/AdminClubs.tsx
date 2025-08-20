import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from "@expo/vector-icons";
import { useHotReload } from '../services/ScrollableService';
import {
  addReadingClub,
  updateReadingClub,
  deleteReadingClub,
  getReadingClubs,
  getRegions,
} from '../services/ReadingClubService';
import { ReadingClub } from '../models/ReadingClub.model';

interface Region {
  id: string;
  name: string;
}

const defaultFormState: Omit<ReadingClub, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  meetingType: 'online',
  location: { address: '', latitude: 0, longitude: 0 },
  schedule: { day: '', time: '', frequency: 'weekly' },
  currentBook: '',
  regionId: '',
  facilitator: { name: '', contact: '' },
  members: [],
  joinRequests: [],
  ratings: [],
};

const AdminClubs: React.FC = () => {
  const [formData, setFormData] = useHotReload(
    'admin_clubs_form',
    defaultFormState
  );

  const [editId, setEditId] = useHotReload(
    'admin_clubs_edit_id',
    null as string | null
  );

  const [clubs, setClubs] = useState<ReadingClub[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClubs, setFilteredClubs] = useState<ReadingClub[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClubs();
    loadRegions();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [clubs, searchTerm]);

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
  };

  const handleFilter = () => {
    if (!searchTerm.trim()) {
      setFilteredClubs(clubs);
      return;
    }
    const term = searchTerm.toLowerCase();
    const results = clubs.filter(
      (club) =>
        club.name.toLowerCase().includes(term) ||
        club.description.toLowerCase().includes(term) ||
        club.currentBook?.toLowerCase().includes(term) ||
        club.facilitator.name.toLowerCase().includes(term)
    );
    setFilteredClubs(results);
  };

  const loadClubs = async () => {
    try {
      setLoading(true);
      const data = await getReadingClubs();
      setClubs(data);
    } catch (err) {
      setError("Failed to load clubs");
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async () => {
    try {
      const data = await getRegions();
      setRegions(data);
    } catch (err) {
      console.error('Error loading regions:', err);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationChange = (name: string, value: string) => {
    setFormData((prev) => {
      const location = prev.location ?? { address: '', latitude: 0, longitude: 0 };
      return {
        ...prev,
        location: {
          address: name === 'address' ? value : location.address,
          latitude: name === 'latitude' ? parseFloat(value) || 0 : location.latitude,
          longitude: name === 'longitude' ? parseFloat(value) || 0 : location.longitude,
        },
      };
    });
  };

  const handleScheduleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [name]: value,
      },
    }));
  };

  const handleFacilitatorChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      facilitator: {
        ...prev.facilitator,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editId) {
        await updateReadingClub(editId, formData);
      } else {
        await addReadingClub(formData);
      }
      setShowForm(false);
      setFormData(defaultFormState);
      setEditId(null);
      await loadClubs();
    } catch (err) {
      setError("Failed to save club");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (club: ReadingClub) => {
    const { id, createdAt, updatedAt, ...rest } = club;
    setFormData(rest);
    setEditId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Club',
      'Are you sure you want to delete this club?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReadingClub(id);
              await loadClubs();
            } catch (err) {
              setError("Failed to delete club");
            }
          },
        },
      ]
    );
  };

  const resetSearch = () => {
    setSearchTerm('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reading Clubs</Text>
          <Text style={styles.headerSubtitle}>BBT Africa Connect - Admin</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="book-outline" size={24} color="#FF6B00" />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Clubs</Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                placeholder="Search by name, book, facilitator..."
                placeholderTextColor="#999"
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={handleSearchChange}
              />
            </View>
            <View style={styles.searchButtons}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleFilter}>
                <Ionicons name="search" size={16} color="#FFF" />
                <Text style={styles.buttonText}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetSearch}>
                <Ionicons name="refresh" size={16} color="#FF6B00" />
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Add Club Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowForm((prev) => !prev)}
          >
            <Ionicons name={showForm ? "close" : "add-circle-outline"} size={20} color="#FFF" />
            <Text style={styles.buttonText}>{showForm ? 'Close Form' : 'Add Reading Club'}</Text>
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        {showForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{editId ? 'Edit Club' : 'Add Club'}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Club Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(t) => handleChange('name', t)}
                placeholder="Club Name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(t) => handleChange('description', t)}
                placeholder="Description"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meeting Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.meetingType}
                  onValueChange={(v) => handleChange('meetingType', v)}
                  style={styles.picker}
                >
                  <Picker.Item label="Online" value="online" />
                  <Picker.Item label="In-Person" value="in-person" />
                  <Picker.Item label="Hybrid" value="hybrid" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location Address</Text>
              <TextInput
                style={styles.input}
                value={formData.location?.address || ''}
                onChangeText={(t) => handleLocationChange('address', t)}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location?.latitude?.toString() || '0'}
                  onChangeText={(t) => handleLocationChange('latitude', t)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location?.longitude?.toString() || '0'}
                  onChangeText={(t) => handleLocationChange('longitude', t)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Day</Text>
                <TextInput
                  style={styles.input}
                  value={formData.schedule.day}
                  onChangeText={(t) => handleScheduleChange('day', t)}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Time</Text>
                <TextInput
                  style={styles.input}
                  value={formData.schedule.time}
                  onChangeText={(t) => handleScheduleChange('time', t)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.schedule.frequency}
                  onValueChange={(v) => handleScheduleChange('frequency', v)}
                  style={styles.picker}
                >
                  <Picker.Item label="Weekly" value="weekly" />
                  <Picker.Item label="Biweekly" value="biweekly" />
                  <Picker.Item label="Monthly" value="monthly" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Book</Text>
              <TextInput
                style={styles.input}
                value={formData.currentBook}
                onChangeText={(t) => handleChange('currentBook', t)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Region</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.regionId}
                  onValueChange={(v) => handleChange('regionId', v)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Region" value="" />
                  {regions.map((r) => (
                    <Picker.Item key={r.id} label={r.name} value={r.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Facilitator Name</Text>
              <TextInput
                style={styles.input}
                value={formData.facilitator.name}
                onChangeText={(t) => handleFacilitatorChange('name', t)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Facilitator Contact</Text>
              <TextInput
                style={styles.input}
                value={formData.facilitator.contact}
                onChangeText={(t) => handleFacilitatorChange('contact', t)}
              />
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.buttonText}>{editId ? 'Update Club' : 'Add Club'}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowForm(false)}>
                <Ionicons name="close-circle-outline" size={20} color="#FF6B00" />
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Clubs List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clubs ({filteredClubs.length})</Text>
          {filteredClubs.map((club) => (
            <View key={club.id} style={styles.groupCard}>
              <Text style={styles.groupName}>{club.name}</Text>
              <Text style={styles.groupDescription}>{club.description}</Text>
              <Text style={styles.groupDescription}>📖 Book: {club.currentBook || 'N/A'}</Text>
              <Text style={styles.groupDescription}>
                Facilitator: {club.facilitator.name} ({club.facilitator.contact})
              </Text>
              <Text style={styles.groupDescription}>
                Schedule: {club.schedule.day} {club.schedule.time} ({club.schedule.frequency})
              </Text>

              <View style={styles.groupActions}>
                <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(club)}>
                  <Ionicons name="pencil" size={16} color="#FF6B00" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(club.id)}>
                  <Ionicons name="trash" size={16} color="#FF4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FDFCFA',
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#FF6B00' },
  headerSubtitle: { fontSize: 12, color: '#999' },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF4E6', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 24 },
  section: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 20, fontWeight: '400', color: '#1A1A1A', marginBottom: 20 },
  searchContainer: { marginBottom: 16 },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 8, backgroundColor: '#F9F9F9', paddingHorizontal: 12, marginBottom: 12,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  searchButtons: { flexDirection: 'row', gap: 12 },
  primaryButton: {
    backgroundColor: '#FF6B00', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 18,
  },
  secondaryButton: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 18,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  secondaryButtonText: { color: '#FF6B00', fontSize: 16, marginLeft: 8 },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2', borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 16,
  },
  errorText: { color: '#FF4444', marginLeft: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12,
    fontSize: 16, backgroundColor: '#FFF',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  inputWrapper: { flex: 1 },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  groupCard: {
    backgroundColor: '#FFF9F5', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#FFE4CC',
  },
  groupName: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  groupDescription: { fontSize: 14, color: '#666', marginBottom: 6 },
  groupActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  editButton: { backgroundColor: '#FFF4E6', borderWidth: 1, borderColor: '#FF6B00' },
  editButtonText: { color: '#FF6B00', marginLeft: 4, fontWeight: '500' },
  deleteButton: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FF4444' },
  deleteButtonText: { color: '#FF4444', marginLeft: 4, fontWeight: '500' },
});

export default AdminClubs;
