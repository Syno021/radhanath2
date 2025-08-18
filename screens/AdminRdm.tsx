import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useHotReload } from '../services/ScrollableService';
import { Region } from '../models/region.model';
import { addRegion, getRegions, updateRegion, deleteRegion } from '../services/regionService';
import { rnPageStyles } from '../css/page'; // Import styles from the CSS file

const defaultFormState: Omit<Region, 'id'> = {
  name: '',
  description: '',
  location: { latitude: 0, longitude: 0 },
  whatsappGroups: [],
  ReadingClubs: [],
  numberoftemples: undefined,
};

const AdminRegions: React.FC = () => {
  // Use a proper React Native ScrollView ref
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

  // 🔍 Search function - updated to search by reading club count instead of IDs
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredRegions(regions);
      return;
    }
    const filtered = regions.filter((region) =>
      region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // You can still search by reading club count if needed
      (region.ReadingClubs?.length || 0).toString().includes(searchTerm)
    );
    setFilteredRegions(filtered);
  };

  // ♻️ Reset search
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
  };

  const handleFormToggle = () => {
    setShowForm((prev) => !prev);
    if (!showForm) resetForm();
  };

  // Helper function to get reading club count
  const getReadingClubCount = (region: Region): number => {
    return region.ReadingClubs?.length || 0;
  };

  // Scroll helper functions for React Native
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  if (loading && regions.length === 0) {
    return (
      <View style={[rnPageStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={rnPageStyles.button.backgroundColor} />
        <Text style={[{ marginTop: 16 }, rnPageStyles.textSecondary]}>
          Loading regions...
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
        {/* Sticky Header */}
        <View style={rnPageStyles.stickyHeader}>
          <Text style={rnPageStyles.header}>Admin Regions</Text>

          {/* 🔍 Search Bar */}
          <View style={rnPageStyles.searchContainer}>
            <TextInput
              style={rnPageStyles.searchInput}
              placeholder="Search regions by name, description, or reading club count..."
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
          
          <View style={rnPageStyles.headerActions}>
            <TouchableOpacity 
              style={[rnPageStyles.button, loading && rnPageStyles.buttonDisabled]} 
              onPress={handleFormToggle}
              disabled={loading}
            >
              <Text style={rnPageStyles.buttonText}>
                {showForm ? 'Close Form' : 'Add Region'}
              </Text>
            </TouchableOpacity>
            
            <View style={rnPageStyles.statusContainer}>
              <Text style={rnPageStyles.statusText}>
                Regions: {regions.length}
              </Text>
              <Text style={rnPageStyles.statusText}>
                Filtered: {filteredRegions.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View style={{
            backgroundColor: '#fee',
            padding: 16,
            marginBottom: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#fcc',
          }}>
            <Text style={{ color: 'red', fontSize: 14 }}>{error}</Text>
            <TouchableOpacity 
              onPress={() => setError(null)}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: 'red', textDecorationLine: 'underline' }}>
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Form */}
        {showForm && (
          <View style={rnPageStyles.form}>
            <Text style={rnPageStyles.label}>Region Name *</Text>
            <TextInput
              style={rnPageStyles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Region Name"
            />

            <Text style={rnPageStyles.label}>Description</Text>
            <TextInput
              style={[rnPageStyles.input, rnPageStyles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Description"
              multiline
              numberOfLines={3}
            />

            <Text style={rnPageStyles.label}>Latitude *</Text>
            <TextInput
              style={rnPageStyles.input}
              value={formData.location.latitude.toString()}
              onChangeText={(value) => handleLocationChange('latitude', value)}
              placeholder="Latitude"
              keyboardType="numeric"
            />

            <Text style={rnPageStyles.label}>Longitude *</Text>
            <TextInput
              style={rnPageStyles.input}
              value={formData.location.longitude.toString()}
              onChangeText={(value) => handleLocationChange('longitude', value)}
              placeholder="Longitude"
              keyboardType="numeric"
            />

            <Text style={rnPageStyles.label}>Number of Temples</Text>
            <TextInput
              style={rnPageStyles.input}
              value={formData.numberoftemples?.toString() ?? ''}
              onChangeText={(value) => handleInputChange('numberoftemples', value)}
              placeholder="Number of Temples"
              keyboardType="numeric"
            />

            <TouchableOpacity 
              style={[rnPageStyles.button, loading && rnPageStyles.buttonDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={rnPageStyles.buttonText}>
                  {editingRegion ? 'Update Region' : 'Save Region'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Regions List */}
        <View style={rnPageStyles.clubsList}>
          {filteredRegions.map((region) => (
            <View key={region.id} style={rnPageStyles.card}>
              <Text style={rnPageStyles.cardTitle}>{region.name}</Text>
              
              {region.description && (
                <Text style={rnPageStyles.cardText}>{region.description}</Text>
              )}
              
              <Text style={rnPageStyles.cardText}>
                <Text style={rnPageStyles.cardLabel}>📍 Location: </Text>
                {region.location.latitude.toFixed(4)}, {region.location.longitude.toFixed(4)}
              </Text>
              
              <Text style={rnPageStyles.cardText}>
                <Text style={rnPageStyles.cardLabel}>🏛️ Temples: </Text>
                {region.numberoftemples ?? 'N/A'}
              </Text>
              
              <Text style={rnPageStyles.cardText}>
                <Text style={rnPageStyles.cardLabel}>💬 WhatsApp Groups: </Text>
                {region.whatsappGroups?.length || 0}
              </Text>
              
              <Text style={rnPageStyles.cardText}>
                <Text style={rnPageStyles.cardLabel}>📚 Reading Clubs: </Text>
                {getReadingClubCount(region)}
              </Text>

              <View style={rnPageStyles.cardActions}>
                <TouchableOpacity 
                  style={[rnPageStyles.buttonSecondary, loading && rnPageStyles.buttonDisabled]} 
                  onPress={() => handleEdit(region)}
                  disabled={loading}
                >
                  <Text style={rnPageStyles.buttonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[rnPageStyles.buttonDanger, loading && rnPageStyles.buttonDisabled]} 
                  onPress={() => handleDelete(region.id)}
                  disabled={loading}
                >
                  <Text style={rnPageStyles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {filteredRegions.length === 0 && !loading && (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text style={rnPageStyles.cardText}>
              {searchTerm ? 'No regions match your search.' : 'No regions found.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AdminRegions;