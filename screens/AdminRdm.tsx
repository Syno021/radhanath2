import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useHotReload } from '../services/ScrollableService';
import { Region } from '../models/region.model';
import { addRegion, getRegions, updateRegion, deleteRegion } from '../services/regionService';
import GuideOverlay from '../components/GuideOverlay';

const defaultFormState: Omit<Region, 'id'> = {
  name: '',
  description: '',
  location: { latitude: 0, longitude: 0 },
  whatsappGroups: [],
  ReadingClubs: [],
  numberoftemples: undefined,
};

const AdminRegions: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useHotReload(
    'admin_regions_form',
    defaultFormState
  );

  const [editId, setEditId] = useHotReload(
    'admin_regions_edit_id',
    null as string | null
  );

  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const guideSteps = [
    {
      title: "Add Region",
      description: "Create a new region by providing its name, description, and geographical coordinates.",
      icon: "add-circle-outline"
    },
    {
      title: "Location Details",
      description: "Set precise latitude and longitude coordinates to mark the region on the map.",
      icon: "location-outline"
    },
    {
      title: "Temple Information",
      description: "Specify the number of temples in the region and manage associated WhatsApp groups.",
      icon: "business-outline"
    },
    {
      title: "Manage Regions",
      description: "Edit or remove existing regions, and view associated reading clubs and temples.",
      icon: "map-outline"
    }
  ];

  useEffect(() => { loadRegions(); }, []);

  const loadRegions = async () => {
    try {
      setLoading(true);
      const data = await getRegions();
      setRegions(data);
      setFilteredRegions(data);
    } catch (err) {
      setError('Failed to load regions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredRegions(regions);
      return;
    }
    const filtered = regions.filter((region) =>
      region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (region.ReadingClubs?.length || 0).toString().includes(searchTerm)
    );
    setFilteredRegions(filtered);
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setFilteredRegions(regions);
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'numberoftemples'
        ? value === '' ? undefined : parseInt(value, 10)
        : value,
    }));
  };

  const handleLocationChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [name]: parseFloat(value) || 0 },
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editingRegion) {
        await updateRegion(editingRegion.id, formData);
      } else {
        await addRegion(formData);
      }
      setShowForm(false);
      setEditingRegion(null);
      resetForm();
      loadRegions();
    } catch (err) {
      setError('Failed to save region');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (region: Region) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      description: region.description || '',
      location: region.location,
      whatsappGroups: region.whatsappGroups || [],
      ReadingClubs: region.ReadingClubs || [],
      numberoftemples: region.numberoftemples,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Region',
      'Are you sure you want to delete this region?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteRegion(id);
              loadRegions();
            } catch (err) {
              setError('Failed to delete region');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData(defaultFormState);
    setEditingRegion(null);
    setEditId(null);
  };

  const handleFormToggle = () => {
    setShowForm((prev) => !prev);
    if (showForm) resetForm();
  };

  const getReadingClubCount = (region: Region): number => {
    return region.ReadingClubs?.length || 0;
  };

  if (loading && regions.length === 0) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading regions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Regions</Text>
          <Text style={styles.headerSubtitle}>BBT Africa Connect - Admin</Text>
        </View>
        <View style={styles.headerIcon}>
          <TouchableOpacity 
            onPress={() => setShowGuide(true)}
          >
            <Ionicons name="help-circle-outline" size={24} color="#FF6B00" />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Ionicons name="map-outline" size={24} color="#FF6B00" />
          </View>
        </View>
      </View>

      <GuideOverlay
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        steps={guideSteps}
        screenName="Region Management"
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Regions</Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                placeholder="Search regions..."
                placeholderTextColor="#999"
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                editable={!loading}
              />
            </View>

            <View style={styles.searchButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSearch}
                disabled={loading}
              >
                <Ionicons name="search" size={16} color="#FFFFFF" />
                <Text style={styles.buttonText}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                onPress={handleResetSearch}
                disabled={loading}
              >
                <Ionicons name="refresh" size={16} color="#FF6B00" />
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <Text style={styles.statValue}>{regions.length}</Text>
              <Text style={styles.statLabel}>Total Regions</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statValue}>{filteredRegions.length}</Text>
              <Text style={styles.statLabel}>Showing</Text>
            </View>
          </View>
        </View>

        {/* Add Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleFormToggle}
            disabled={loading}
          >
            <Ionicons name={showForm ? "close" : "add-circle-outline"} size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>{showForm ? 'Close Form' : 'Add Region'}</Text>
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
            <Text style={styles.sectionTitle}>{editingRegion ? 'Edit Region' : 'Add Region'}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Region Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(v) => handleInputChange('name', v)}
                placeholder="Region Name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(v) => handleInputChange('description', v)}
                placeholder="Description"
                multiline
              />
            </View>

            <View style={styles.row}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Latitude *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location.latitude.toString()}
                  onChangeText={(v) => handleLocationChange('latitude', v)}
                  keyboardType="numeric"
                  placeholder="Latitude"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Longitude *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location.longitude.toString()}
                  onChangeText={(v) => handleLocationChange('longitude', v)}
                  keyboardType="numeric"
                  placeholder="Longitude"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Temples</Text>
              <TextInput
                style={styles.input}
                value={formData.numberoftemples?.toString() ?? ''}
                onChangeText={(v) => handleInputChange('numberoftemples', v)}
                keyboardType="numeric"
                placeholder="Number of Temples"
              />
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.buttonText}>{editingRegion ? 'Update' : 'Save'}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleFormToggle}
                disabled={loading}
              >
                <Ionicons name="close-circle-outline" size={20} color="#FF6B00" />
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Regions List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regions ({filteredRegions.length})</Text>
          {filteredRegions.map((region) => (
            <View key={region.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{region.name}</Text>
                  <Text style={styles.groupDescription}>{region.description}</Text>
                </View>
              </View>

              <View style={styles.groupMeta}>
                <Text style={styles.groupRegion}>
                  <Ionicons name="location-outline" size={14} color="#666" />{' '}
                  {region.location.latitude.toFixed(4)}, {region.location.longitude.toFixed(4)}
                </Text>
              </View>

              <Text style={styles.groupDescription}>🏛️ Temples: {region.numberoftemples ?? 'N/A'}</Text>
              <Text style={styles.groupDescription}>💬 WhatsApp Groups: {region.whatsappGroups?.length || 0}</Text>
              <Text style={styles.groupDescription}>📚 Reading Clubs: {getReadingClubCount(region)}</Text>

              <View style={styles.groupActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(region)}
                  disabled={loading}
                >
                  <Ionicons name="pencil" size={16} color="#FF6B00" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(region.id)}
                  disabled={loading}
                >
                  <Ionicons name="trash" size={16} color="#FF4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {filteredRegions.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color="#DDD" />
            <Text style={styles.emptyStateText}>
              {searchTerm ? 'No regions match your search.' : 'No regions yet'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA',
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#FF6B00' },
  headerSubtitle: { fontSize: 12, color: '#999' },
  headerIcon: {
    width: 40, height: 40, backgroundColor: '#FFF4E6',
    borderRadius: 20, alignItems: 'center', justifyContent: 'center'
  },
  content: { flex: 1, paddingHorizontal: 24 },
  section: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 16,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 20, fontWeight: '400', color: '#1A1A1A', marginBottom: 20 },
  searchContainer: { marginBottom: 16 },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    backgroundColor: '#F9F9F9', paddingHorizontal: 12, marginBottom: 12,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1A1A1A' },
  searchButtons: { flexDirection: 'row', gap: 12 },
  statsContainer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statBadge: {
    flex: 1, backgroundColor: '#FFF4E6', borderRadius: 8,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FFE4CC',
  },
  statValue: { fontSize: 20, color: '#FF6B00', fontWeight: '600' },
  statLabel: { fontSize: 12, color: '#FF6B00' },
  primaryButton: {
    backgroundColor: '#FF6B00', paddingVertical: 18, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E0E0E0',
    paddingVertical: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#FFB380' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  secondaryButtonText: { color: '#FF6B00', fontSize: 16, marginLeft: 8 },
  errorContainer: {
    backgroundColor: '#FFEBEE', padding: 16, marginBottom: 16, borderRadius: 8,
    borderWidth: 1, borderColor: '#FFCDD2', flexDirection: 'row', alignItems: 'center',
  },
  errorText: { color: '#FF4444', marginLeft: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, marginBottom: 8, fontWeight: '500', color: '#1A1A1A' },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 12, fontSize: 16, backgroundColor: '#FFF', color: '#1A1A1A',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  inputWrapper: { flex: 1 },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  groupCard: {
    backgroundColor: '#FFF9F5', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#FFE4CC',
  },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  groupDescription: { fontSize: 14, color: '#666', marginBottom: 6 },
  groupMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  groupRegion: { fontSize: 13, color: '#666' },
  groupActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8,
  },
  editButton: { backgroundColor: '#FFF4E6', borderWidth: 1, borderColor: '#FF6B00' },
  editButtonText: { color: '#FF6B00', fontSize: 14, marginLeft: 4 },
  deleteButton: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FF4444' },
  deleteButtonText: { color: '#FF4444', fontSize: 14, marginLeft: 4 },
  emptyState: {
    alignItems: 'center', padding: 40, backgroundColor: '#FFF',
    borderRadius: 12, marginBottom: 16,
  },
  emptyStateText: { fontSize: 16, color: '#666', marginTop: 16 },
  loadingState: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF',
  },
  loadingText: { fontSize: 14, color: '#666', marginTop: 16 },
});

export default AdminRegions;
