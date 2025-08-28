import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
// Remove the old Picker import
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import TempleService, { Temple, Region, TempleInput } from '../services/TempleService';
import GuideOverlay from '../components/GuideOverlay';

const { width: screenWidth } = Dimensions.get('window');

const defaultFormState: TempleInput = {
  name: '',
  description: '',
  regionId: '',
  imageUrl: '',
};

const AdminTemples: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<TempleInput>(defaultFormState);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemple, setEditingTemple] = useState<Temple | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTemples, setFilteredTemples] = useState<Temple[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const guideSteps = [
    {
      title: "Add Temple",
      description: "Add a new temple by providing its name, description, and location details.",
      icon: "add-circle-outline"
    },
    {
      title: "Upload Images",
      description: "Upload temple photos to help devotees recognize the temple.",
      icon: "camera-outline"
    },
    {
      title: "Assign Region",
      description: "Connect temples to specific regions for better organization.",
      icon: "map-outline"
    },
    {
      title: "Manage Temples",
      description: "Edit or remove temples, and keep their information up to date.",
      icon: "business-outline"
    }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const filtered = TempleService.searchTemples(temples, searchTerm);
    setFilteredTemples(filtered);
  }, [temples, searchTerm]);

  const loadInitialData = async () => {
    await Promise.all([loadTemples(), loadRegions()]);
  };

  const loadTemples = async () => {
    try {
      setLoading(true);
      const data = await TempleService.getTemples();
      setTemples(data);
      setFilteredTemples(data);
    } catch (err) {
      setError('Failed to load temples');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async () => {
    try {
      const data = await TempleService.getRegions();
      setRegions(data);
    } catch (err) {
      setError('Failed to load regions');
      console.error(err);
    }
  };

  const handleImageUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }
      setImageLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]?.base64) {
        const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        setValidationErrors([]);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSearch = () => {
    const filtered = TempleService.searchTemples(temples, searchTerm);
    setFilteredTemples(filtered);
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setFilteredTemples(temples);
  };

  const handleInputChange = (name: keyof TempleInput, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationErrors([]);
  };

  const validateForm = (): boolean => {
    const errors = TempleService.validateTempleData(formData);
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      if (editingTemple) {
        await TempleService.updateTemple(editingTemple.id, formData);
        Alert.alert('Success', 'Temple updated successfully');
      } else {
        await TempleService.addTemple(formData);
        Alert.alert('Success', 'Temple created successfully');
      }
      setShowForm(false);
      resetForm();
      await loadTemples();
    } catch (err) {
      setError('Failed to save temple');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (temple: Temple) => {
    setFormData({
      name: temple.name,
      description: temple.description || '',
      regionId: temple.regionId,
      imageUrl: temple.imageUrl || '',
    });
    setEditingTemple(temple);
    setEditId(temple.id);
    setShowForm(true);
    setValidationErrors([]);
  };

  const handleDelete = async (id: string) => {
    const temple = temples.find(t => t.id === id);
    Alert.alert(
      'Delete Temple',
      `Are you sure you want to delete "${temple?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await TempleService.deleteTemple(id);
              await loadTemples();
            } catch (err) {
              setError('Failed to delete temple');
              console.error(err);
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
    setEditingTemple(null);
    setEditId(null);
    setValidationErrors([]);
  };

  const getRegionName = (regionId: string): string =>
    regions.find(r => r.id === regionId)?.name || 'Unknown Region';

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString();
    if (timestamp instanceof Date) return timestamp.toLocaleDateString();
    return 'N/A';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Temples</Text>
          <Text style={styles.headerSubtitle}>BBT Africa Connect - Admin</Text>
        </View>
        <View >
          <TouchableOpacity 
            
            onPress={() => setShowGuide(true)}
          >
            <Ionicons name="help-circle-outline" size={24} color="#FF6B00" />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Ionicons name="business-outline" size={24} color="#FF6B00" />
          </View>
        </View>
      </View>

      <GuideOverlay
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        steps={guideSteps}
        screenName="Temple Management"
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Temples</Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                placeholder="Search temples..."
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
                <Ionicons name="search" size={16} color="#FFF" />
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
        </View>

        {/* Add Temple Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={() => setShowForm(prev => !prev)}
            disabled={loading}
          >
            <Ionicons name={showForm ? "close" : "add-circle-outline"} size={20} color="#FFF" />
            <Text style={styles.buttonText}>
              {showForm ? 'Close Form' : 'Add Temple'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF6B00" />
            <View>
              {validationErrors.map((e, i) => (
                <Text key={i} style={styles.errorText}>• {e}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Form */}
        {showForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {editingTemple ? 'Edit Temple' : 'Add Temple'}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Temple Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={v => handleInputChange('name', v)}
                placeholder="Enter temple name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={v => handleInputChange('description', v)}
                placeholder="Enter temple description"
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Region *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.regionId}
                  onValueChange={v => handleInputChange('regionId', v)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a region..." value="" />
                  {regions.map(r => (
                    <Picker.Item key={r.id} label={r.name} value={r.id} />
                  ))}
                </Picker>
              </View>
            </View>
            {/* Image Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Image</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.primaryButton, imageLoading && styles.buttonDisabled]}
                  onPress={handleImageUpload}
                  disabled={imageLoading || loading}
                >
                  <Ionicons name="camera" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Upload</Text>
                </TouchableOpacity>
                {formData.imageUrl ? (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                  >
                    <Ionicons name="trash" size={16} color="#FF4444" />
                    <Text style={styles.secondaryButtonText}>Clear</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {formData.imageUrl ? (
                <Image source={{ uri: formData.imageUrl }} style={styles.previewImage} />
              ) : null}
            </View>
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {editingTemple ? 'Update Temple' : 'Save Temple'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => { setShowForm(false); resetForm(); }}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Temples List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temples ({filteredTemples.length})</Text>
          {filteredTemples.map(t => (
            <View key={t.id} style={styles.groupCard}>
              {t.imageUrl ? (
                <Image source={{ uri: t.imageUrl }} style={styles.cardImage} />
              ) : null}
              <Text style={styles.groupName}>{t.name}</Text>
              {t.description ? <Text style={styles.groupDescription}>{t.description}</Text> : null}
              <Text style={styles.groupRegion}>
                <Ionicons name="location-outline" size={14} color="#666" /> {getRegionName(t.regionId)}
              </Text>
              <Text style={styles.groupDescription}>
                Created: {formatTimestamp(t.createdAt)}
              </Text>
              {t.updatedAt ? (
                <Text style={styles.groupDescription}>
                  Updated: {formatTimestamp(t.updatedAt)}
                </Text>
              ) : null}
              <View style={styles.groupActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(t)}
                >
                  <Ionicons name="pencil" size={16} color="#FF6B00" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(t.id)}
                >
                  <Ionicons name="trash" size={16} color="#FF4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {filteredTemples.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color="#DDD" />
            <Text style={styles.emptyStateText}>No temples found</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first temple to start managing them here
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA',
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#FF6B00' },
  headerSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  headerIcon: {
    width: 40, height: 40, backgroundColor: '#FFF4E6',
    borderRadius: 20, alignItems: 'center', justifyContent: 'center'
  },
  content: { paddingHorizontal: 24 },
  section: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#FFE4CC'
  },
  sectionTitle: { fontSize: 20, fontWeight: '500', marginBottom: 16, color: '#1A1A1A' },
  searchContainer: { marginBottom: 16 },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 8, backgroundColor: '#F9F9F9',
    paddingHorizontal: 12, marginBottom: 12
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1A1A1A' },
  searchButtons: { flexDirection: 'row', gap: 12 },
  primaryButton: {
    backgroundColor: '#FF6B00', paddingVertical: 14, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flex: 1
  },
  secondaryButton: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E0E0E0',
    paddingVertical: 14, borderRadius: 12, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', flex: 1
  },
  buttonText: { color: '#FFF', fontWeight: '600', marginLeft: 8 },
  secondaryButtonText: { color: '#FF6B00', fontWeight: '500', marginLeft: 8 },
  buttonDisabled: { backgroundColor: '#FFB380' },
  errorContainer: {
    backgroundColor: '#FFEBEE', padding: 16, marginBottom: 16, borderRadius: 8,
    borderWidth: 1, borderColor: '#FFCDD2', flexDirection: 'row', alignItems: 'center'
  },
  errorText: { color: '#FF4444', marginLeft: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontWeight: '500', marginBottom: 6, color: '#1A1A1A' },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 12, fontSize: 16, backgroundColor: '#FFF', color: '#1A1A1A'
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  pickerContainer: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, backgroundColor: '#FFF'
  },
  picker: { height: 50, color: '#1A1A1A' },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  previewImage: { width: screenWidth * 0.8, height: 200, borderRadius: 8, marginTop: 12 },
  groupCard: {
    backgroundColor: '#FFF9F5', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#FFE4CC'
  },
  cardImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  groupName: { fontSize: 16, fontWeight: '500', marginBottom: 6 },
  groupDescription: { fontSize: 14, color: '#666', marginBottom: 6 },
  groupRegion: { fontSize: 13, color: '#666', marginBottom: 6 },
  groupActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', paddingVertical: 10, borderRadius: 8
  },
  editButton: { backgroundColor: '#FFF4E6', borderWidth: 1, borderColor: '#FF6B00' },
  editButtonText: { color: '#FF6B00', marginLeft: 4 },
  deleteButton: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FF4444' },
  deleteButtonText: { color: '#FF4444', marginLeft: 4 },
  emptyState: {
    alignItems: 'center', padding: 40, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 16
  },
  emptyStateText: { fontSize: 16, color: '#666', marginTop: 16, marginBottom: 8 },
  emptyStateSubtext: { fontSize: 13, color: '#999', textAlign: 'center' }
});

export default AdminTemples;
