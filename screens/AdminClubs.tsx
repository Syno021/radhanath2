import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Added this import
import { useScrollable, useHotReload, useScrollRestore } from '../services/ScrollableService';
import {
  addReadingClub,
  updateReadingClub,
  deleteReadingClub,
  getReadingClubs,
  getRegions,
} from '../services/ReadingClubService';
import { ReadingClub } from '../models/ReadingClub.model';
import { rnPageStyles, colors } from '../css/page';

const { width: screenWidth } = Dimensions.get('window');

// Custom Picker Component
interface CustomPickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: Array<{ label: string; value: string }>;
  placeholder?: string;
  style?: any;
  disabled?: boolean;
}

const CustomPicker: React.FC<CustomPickerProps> = ({
  selectedValue,
  onValueChange,
  items,
  placeholder = "Select an option...",
  style,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find(item => item.value === selectedValue);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[rnPageStyles.customPickerButton, style, disabled && rnPageStyles.customPickerDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[rnPageStyles.customPickerText, !selectedItem && rnPageStyles.customPickerPlaceholder]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? colors.border : colors.textSecondary} 
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={rnPageStyles.customPickerModalOverlay}>
          <View style={rnPageStyles.customPickerModalContainer}>
            <View style={rnPageStyles.customPickerModalHeader}>
              <Text style={rnPageStyles.customPickerModalTitle}>Select Option</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={rnPageStyles.customPickerCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    rnPageStyles.customPickerOptionItem,
                    item.value === selectedValue && rnPageStyles.customPickerSelectedOption
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={[
                    rnPageStyles.customPickerOptionText,
                    item.value === selectedValue && rnPageStyles.customPickerSelectedText
                  ]}>
                    {item.label}
                  </Text>
                  {item.value === selectedValue && (
                    <Ionicons name="checkmark" size={20} color={colors.churchOrange} />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
              style={rnPageStyles.customPickerOptionsList}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

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
  const [formData, setFormData, clearFormData] = useHotReload(
    'admin_clubs_form',
    defaultFormState
  );

  const [editId, setEditId, clearEditId] = useHotReload(
    'admin_clubs_edit_id',
    null as string | null
  );

  const [clubs, setClubs] = useState<ReadingClub[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClubs, setFilteredClubs] = useState<ReadingClub[]>([]);

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

  const handleSearchSubmit = () => {
    handleFilter();
  };

  const loadClubs = async () => {
    try {
      const data = await getReadingClubs();
      setClubs(data);
    } catch (err) {
      console.error(err);
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
      console.error(err);
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
              console.error(err);
            }
          },
        },
      ]
    );
  };

  const resetSearch = () => {
    setSearchTerm('');
  };

  // Prepare picker items
  const meetingTypeItems = [
    { label: 'Online', value: 'online' },
    { label: 'In-Person', value: 'in-person' },
    { label: 'Hybrid', value: 'hybrid' },
  ];

  const frequencyItems = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Biweekly', value: 'biweekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  const regionItems = [
    { label: 'Select a Region', value: '' },
    ...regions.map(region => ({
      label: region.name,
      value: region.id
    }))
  ];

  return (
    <ScrollView style={rnPageStyles.container} contentContainerStyle={rnPageStyles.contentContainer}>
      <View style={rnPageStyles.stickyHeader}>
        <Text style={rnPageStyles.header}>Admin Reading Clubs</Text>
        
        {/* Search Section */}
        <View style={rnPageStyles.searchContainer}>
          <TextInput
            style={rnPageStyles.searchInput}
            placeholder="Search by name, description, book, facilitator..."
            value={searchTerm}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          <View style={rnPageStyles.searchButtons}>
            <TouchableOpacity style={rnPageStyles.button} onPress={handleSearchSubmit}>
              <Text style={rnPageStyles.buttonText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rnPageStyles.buttonSecondary} onPress={resetSearch}>
              <Text style={rnPageStyles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={rnPageStyles.headerActions}>
          <TouchableOpacity
            style={[rnPageStyles.button, loading && rnPageStyles.buttonDisabled]}
            onPress={() => setShowForm((prev) => !prev)}
            disabled={loading}
          >
            <Text style={rnPageStyles.buttonText}>
              {showForm ? 'Close Form' : 'Add Reading Club'}
            </Text>
          </TouchableOpacity>
          
          <View style={rnPageStyles.statusContainer}>
            <Text style={rnPageStyles.statusText}>
              Clubs: {clubs.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Form Section */}
      {showForm && (
        <View style={rnPageStyles.form}>
          <Text style={rnPageStyles.cardTitle}>
            {editId ? 'Edit Reading Club' : 'Add Reading Club'}
          </Text>
          
          <TextInput
            style={rnPageStyles.input}
            placeholder="Club Name"
            value={formData.name}
            onChangeText={(text) => handleChange('name', text)}
            editable={!loading}
          />
          
          <TextInput
            style={[rnPageStyles.input, rnPageStyles.textArea]}
            placeholder="Description"
            value={formData.description}
            onChangeText={(text) => handleChange('description', text)}
            multiline
            numberOfLines={3}
            editable={!loading}
          />

          <View style={rnPageStyles.pickerContainer}>
            <Text style={rnPageStyles.label}>Meeting Type</Text>
            <CustomPicker
              selectedValue={formData.meetingType}
              onValueChange={(value) => handleChange('meetingType', value)}
              items={meetingTypeItems}
              placeholder="Select Meeting Type"
              disabled={loading}
            />
          </View>

          <TextInput
            style={rnPageStyles.input}
            placeholder="Location Address"
            value={formData.location?.address || ''}
            onChangeText={(text) => handleLocationChange('address', text)}
            editable={!loading}
          />
          
          <TextInput
            style={rnPageStyles.input}
            placeholder="Latitude"
            value={formData.location?.latitude?.toString() || '0'}
            onChangeText={(text) => handleLocationChange('latitude', text)}
            keyboardType="numeric"
            editable={!loading}
          />
          
          <TextInput
            style={rnPageStyles.input}
            placeholder="Longitude"
            value={formData.location?.longitude?.toString() || '0'}
            onChangeText={(text) => handleLocationChange('longitude', text)}
            keyboardType="numeric"
            editable={!loading}
          />

          <TextInput
            style={rnPageStyles.input}
            placeholder="Day (e.g., Monday)"
            value={formData.schedule.day}
            onChangeText={(text) => handleScheduleChange('day', text)}
            editable={!loading}
          />
          
          <TextInput
            style={rnPageStyles.input}
            placeholder="Time (e.g., 14:30)"
            value={formData.schedule.time}
            onChangeText={(text) => handleScheduleChange('time', text)}
            editable={!loading}
          />

          <View style={rnPageStyles.pickerContainer}>
            <Text style={rnPageStyles.label}>Frequency</Text>
            <CustomPicker
              selectedValue={formData.schedule.frequency}
              onValueChange={(value) => handleScheduleChange('frequency', value)}
              items={frequencyItems}
              placeholder="Select Frequency"
              disabled={loading}
            />
          </View>

          <TextInput
            style={rnPageStyles.input}
            placeholder="Current Book"
            value={formData.currentBook || ''}
            onChangeText={(text) => handleChange('currentBook', text)}
            editable={!loading}
          />

          <View style={rnPageStyles.pickerContainer}>
            <Text style={rnPageStyles.label}>Region</Text>
            <CustomPicker
              selectedValue={formData.regionId}
              onValueChange={(value) => handleChange('regionId', value)}
              items={regionItems}
              placeholder="Select a Region"
              disabled={loading}
            />
          </View>

          <TextInput
            style={rnPageStyles.input}
            placeholder="Facilitator Name"
            value={formData.facilitator.name}
            onChangeText={(text) => handleFacilitatorChange('name', text)}
            editable={!loading}
          />
          
          <TextInput
            style={rnPageStyles.input}
            placeholder="Facilitator Contact"
            value={formData.facilitator.contact}
            onChangeText={(text) => handleFacilitatorChange('contact', text)}
            editable={!loading}
          />

          <View style={rnPageStyles.searchButtons}>
            <TouchableOpacity 
              style={[rnPageStyles.button, loading && rnPageStyles.buttonDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={rnPageStyles.buttonText}>
                {editId ? 'Update Club' : 'Add Club'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[rnPageStyles.buttonSecondary, loading && rnPageStyles.buttonDisabled]}
              onPress={() => {
                setShowForm(false);
                setFormData(defaultFormState);
                setEditId(null);
              }}
              disabled={loading}
            >
              <Text style={rnPageStyles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Clubs List */}
      <View style={rnPageStyles.clubsList}>
        {filteredClubs.map((club) => (
          <View key={club.id} style={rnPageStyles.card}>
            <Text style={rnPageStyles.cardTitle}>{club.name}</Text>
            <Text style={rnPageStyles.cardText}>{club.description}</Text>
            <Text style={rnPageStyles.cardText}>
              <Text style={rnPageStyles.cardLabel}>Meeting Type: </Text>
              {club.meetingType}
            </Text>
            {club.location?.address && (
              <Text style={rnPageStyles.cardText}>
                <Text style={rnPageStyles.cardLabel}>Location: </Text>
                {club.location.address}
              </Text>
            )}
            <Text style={rnPageStyles.cardText}>
              <Text style={rnPageStyles.cardLabel}>Schedule: </Text>
              {club.schedule.day} at {club.schedule.time} ({club.schedule.frequency})
            </Text>
            {club.currentBook && (
              <Text style={rnPageStyles.cardText}>
                <Text style={rnPageStyles.cardLabel}>Current Book: </Text>
                {club.currentBook}
              </Text>
            )}
            <Text style={rnPageStyles.cardText}>
              <Text style={rnPageStyles.cardLabel}>Facilitator: </Text>
              {club.facilitator.name} ({club.facilitator.contact})
            </Text>
            <Text style={rnPageStyles.cardText}>
              <Text style={rnPageStyles.cardLabel}>Region: </Text>
              {regions.find(r => r.id === club.regionId)?.name || club.regionId}
            </Text>
            <Text style={rnPageStyles.cardText}>
              <Text style={rnPageStyles.cardLabel}>Members: </Text>
              {club.members?.length || 0}
            </Text>
            
            <View style={rnPageStyles.cardActions}>
              <TouchableOpacity
                style={[rnPageStyles.buttonSecondary, loading && rnPageStyles.buttonDisabled]}
                onPress={() => handleEdit(club)}
                disabled={loading}
              >
                <Text style={rnPageStyles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[rnPageStyles.buttonDanger, loading && rnPageStyles.buttonDisabled]}
                onPress={() => handleDelete(club.id)}
                disabled={loading}
              >
                <Text style={rnPageStyles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Empty State */}
      {clubs.length === 0 && !loading && (
        <View style={{
          alignItems: 'center',
          padding: 32,
          backgroundColor: colors.white,
          borderRadius: 8,
          marginTop: 16,
        }}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            No reading clubs found. Add your first club to get started!
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default AdminClubs;