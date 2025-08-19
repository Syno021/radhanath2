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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import TempleService, { Temple, Region, TempleInput } from '../services/TempleService';
import { rnPageStyles } from '../css/page';

const { width: screenWidth } = Dimensions.get('window');

// Default form state - simplified
const defaultFormState: TempleInput = {
  name: '',
  description: '',
  regionId: '',
  imageUrl: '', // Simple URL string
};

interface AdminTemplesProps {}

const AdminTemples: React.FC<AdminTemplesProps> = () => {
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State management - simplified (removed image-related states)
  const [formData, setFormData] = useState<TempleInput>(defaultFormState);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingTemple, setEditingTemple] = useState<Temple | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredTemples, setFilteredTemples] = useState<Temple[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter temples when search term or temples change
  useEffect(() => {
    const filtered = TempleService.searchTemples(temples, searchTerm);
    setFilteredTemples(filtered);
  }, [temples, searchTerm]);

  const loadInitialData = async (): Promise<void> => {
    await Promise.all([
      loadTemples(),
      loadRegions()
    ]);
  };

  const loadTemples = async (): Promise<void> => {
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

  const loadRegions = async (): Promise<void> => {
    try {
      const data = await TempleService.getRegions();
      setRegions(data);
    } catch (err) {
      setError('Failed to load regions');
      console.error(err);
    }
  };

  const handleSearch = (): void => {
    const filtered = TempleService.searchTemples(temples, searchTerm);
    setFilteredTemples(filtered);
  };

  const handleResetSearch = (): void => {
    setSearchTerm('');
    setFilteredTemples(temples);
  };

  const handleInputChange = (name: keyof TempleInput, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const errors = TempleService.validateTempleData(formData);
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

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
      setEditingTemple(null);
      resetForm();
      await loadTemples();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save temple';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (temple: Temple): void => {
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

  const handleDelete = async (id: string): Promise<void> => {
    const temple = temples.find(t => t.id === id);
    
    Alert.alert(
      'Delete Temple',
      `Are you sure you want to delete "${temple?.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await TempleService.deleteTemple(id);
              Alert.alert('Success', 'Temple deleted successfully');
              await loadTemples();
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Failed to delete temple';
              setError(errorMessage);
              console.error(err);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = (): void => {
    setFormData(defaultFormState);
    setEditingTemple(null);
    setEditId(null);
    setValidationErrors([]);
  };

  const handleFormToggle = (): void => {
    setShowForm(prev => !prev);
    if (!showForm) {
      resetForm();
    }
  };

  const getRegionName = (regionId: string): string => {
    const region = regions.find(r => r.id === regionId);
    return region?.name || 'Unknown Region';
  };

  const scrollToTop = (): void => {
    if (Platform.OS === 'web') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const scrollToBottom = (): void => {
    if (Platform.OS === 'web') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore Timestamp objects
    if (timestamp && typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }
    
    // Handle regular Date objects
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    
    return 'N/A';
  };

  // Render loading state
  if (loading && temples.length === 0) {
    return (
      <View style={[rnPageStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Loading temples...
        </Text>
      </View>
    );
  }

  return (
    <View style={rnPageStyles.container}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={rnPageStyles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View style={rnPageStyles.stickyHeader}>
          <Text style={rnPageStyles.header}>Admin Temples</Text>

          {/* Search Bar */}
          <View style={rnPageStyles.searchContainer}>
            <TextInput
              style={rnPageStyles.searchInput}
              placeholder="Search temples by name, description, or region..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <View style={rnPageStyles.searchButtons}>
              <TouchableOpacity 
                style={rnPageStyles.button} 
                onPress={handleSearch}
                disabled={loading}
              >
                <Text style={rnPageStyles.buttonText}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={rnPageStyles.buttonSecondary} 
                onPress={handleResetSearch}
                disabled={loading}
              >
                <Text style={rnPageStyles.buttonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Header Actions */}
          <View style={rnPageStyles.headerActions}>
            <TouchableOpacity 
              style={[rnPageStyles.button, loading && rnPageStyles.buttonDisabled]} 
              onPress={handleFormToggle}
              disabled={loading}
            >
              <Text style={rnPageStyles.buttonText}>
                {showForm ? 'Close Form' : 'Add Temple'}
              </Text>
            </TouchableOpacity>
            
            <View style={rnPageStyles.statusContainer}>
              <Text style={rnPageStyles.statusText}>
                Temples: {temples.length}
              </Text>
              <Text style={rnPageStyles.statusText}>
                Filtered: {filteredTemples.length}
              </Text>
              <Text style={rnPageStyles.statusText}>
                Regions: {regions.length}
              </Text>
            </View>
          </View>

          {/* Scroll Controls */}
          <View style={styles.scrollControls}>
            <TouchableOpacity style={styles.scrollButton} onPress={scrollToTop}>
              <Text style={styles.scrollButtonText}>↑ Top</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scrollButton} onPress={scrollToBottom}>
              <Text style={styles.scrollButtonText}>↓ Bottom</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              onPress={() => setError(null)}
              style={styles.errorDismiss}
            >
              <Text style={styles.errorDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <View style={styles.validationContainer}>
            <Text style={styles.validationTitle}>Please fix the following errors:</Text>
            {validationErrors.map((error: string, index: number) => (
              <Text key={index} style={styles.validationError}>• {error}</Text>
            ))}
          </View>
        )}

        {/* Form */}
        {showForm && (
          <View style={rnPageStyles.form}>
            <Text>
              {editingTemple ? 'Edit Temple' : 'Add New Temple'}
            </Text>

            <Text style={rnPageStyles.label}>Temple Name *</Text>
            <TextInput
              style={rnPageStyles.input}
              value={formData.name}
              onChangeText={(value: string) => handleInputChange('name', value)}
              placeholder="Enter temple name"
              maxLength={100}
            />

            <Text style={rnPageStyles.label}>Description</Text>
            <TextInput
              style={[rnPageStyles.input, rnPageStyles.textArea]}
              value={formData.description}
              onChangeText={(value: string) => handleInputChange('description', value)}
              placeholder="Enter temple description (optional)"
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <Text style={rnPageStyles.label}>Region *</Text>
            <View style={rnPageStyles.pickerContainer}>
              <Picker
                selectedValue={formData.regionId}
                onValueChange={(value: string) => handleInputChange('regionId', value)}
                style={rnPageStyles.picker}
              >
                <Picker.Item label="Select a region..." value="" />
                {regions.map((region: Region) => (
                  <Picker.Item 
                    key={region.id} 
                    label={region.name} 
                    value={region.id} 
                  />
                ))}
              </Picker>
            </View>

            {/* Image URL Input - Simplified */}
            <Text style={rnPageStyles.label}>Image URL (Optional)</Text>
            <TextInput
              style={rnPageStyles.input}
              value={formData.imageUrl}
              onChangeText={(value: string) => handleInputChange('imageUrl', value)}
              placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
              keyboardType="url"
              autoCapitalize="none"
            />

            {/* Image Preview */}
            {formData.imageUrl && formData.imageUrl.trim() && (
              <View style={styles.imagePreviewContainer}>
                <Text style={styles.imagePreviewLabel}>Preview:</Text>
                <Image 
                  source={{ uri: formData.imageUrl }} 
                  style={styles.previewImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log('Image loading error:', error.nativeEvent.error);
                  }}
                />
              </View>
            )}

            <View style={styles.formButtons}>
              <TouchableOpacity 
                style={[rnPageStyles.button, loading && rnPageStyles.buttonDisabled]} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={rnPageStyles.buttonText}>
                    {editingTemple ? 'Update Temple' : 'Save Temple'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={rnPageStyles.buttonSecondary} 
                onPress={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={loading}
              >
                <Text style={rnPageStyles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Temples List */}
        <View style={rnPageStyles.clubsList}>
          {filteredTemples.map((temple: Temple) => (
            <View key={temple.id} style={rnPageStyles.card}>
              {/* Temple Image */}
              {temple.imageUrl && (
                <View style={styles.cardImageContainer}>
                  <Image 
                    source={{ uri: temple.imageUrl }} 
                    style={styles.cardImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log('Image loading error:', error.nativeEvent.error);
                    }}
                  />
                </View>
              )}
              
              <View style={styles.cardContent}>
                <Text style={rnPageStyles.cardTitle}>{temple.name}</Text>
                
                {temple.description && (
                  <Text style={rnPageStyles.cardText}>{temple.description}</Text>
                )}
                
                <Text style={rnPageStyles.cardText}>
                  <Text style={rnPageStyles.cardLabel}>🏛️ Region: </Text>
                  {temple.regionName || getRegionName(temple.regionId)}
                </Text>
                
                <Text style={rnPageStyles.cardText}>
                  <Text style={rnPageStyles.cardLabel}>📅 Created: </Text>
                  {formatTimestamp(temple.createdAt)}
                </Text>
                
                {temple.updatedAt && (
                  <Text style={rnPageStyles.cardText}>
                    <Text style={rnPageStyles.cardLabel}>✏️ Updated: </Text>
                    {formatTimestamp(temple.updatedAt)}
                  </Text>
                )}

                <View style={rnPageStyles.cardActions}>
                  <TouchableOpacity 
                    style={[rnPageStyles.buttonSecondary, loading && rnPageStyles.buttonDisabled]} 
                    onPress={() => handleEdit(temple)}
                    disabled={loading}
                  >
                    <Text style={rnPageStyles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[rnPageStyles.buttonDanger, loading && rnPageStyles.buttonDisabled]} 
                    onPress={() => handleDelete(temple.id)}
                    disabled={loading}
                  >
                    <Text style={rnPageStyles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Empty State */}
        {filteredTemples.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchTerm ? 'No temples match your search.' : 'No temples found.'}
            </Text>
            {!searchTerm && (
              <TouchableOpacity 
                style={rnPageStyles.button}
                onPress={() => setShowForm(true)}
              >
                <Text style={rnPageStyles.buttonText}>Add First Temple</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  scrollButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  scrollButtonText: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  errorDismiss: {
    marginTop: 8,
  },
  errorDismissText: {
    color: 'red',
    textDecorationLine: 'underline',
  },
  validationContainer: {
    backgroundColor: '#fff3cd',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  validationError: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 2,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 32,
    padding: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  // Image Preview Styles
  imagePreviewContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  imagePreviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  previewImage: {
    width: screenWidth * 0.8,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  // Card Image Styles
  cardImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 16,
  },
});

export default AdminTemples;