import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Added this import
import { useScrollable, useHotReload, useScrollRestore } from '../services/ScrollableService';
import {
  getWhatsappGroups,
  addWhatsappGroup,
  updateWhatsappGroup,
  deleteWhatsappGroup,
} from '../services/WhatsappGroupService';
import { WhatsappGroup } from '../models/whatsappGroup.model';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseCo';
import { rnPageStyles, colors } from '../css/page'; // Import styles from the CSS file

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

// Use styles from rnPageStyles instead of local styles object

// Define default form state
const defaultFormState: Omit<WhatsappGroup, 'id'> = {
  name: '',
  description: '',
  inviteLink: '',
  regionId: '',
  memberCount: 0,
  groupType: 'general',
};

const AdminGroups: React.FC = () => {
  const [formData, setFormData, clearFormData] = useHotReload(
    'admin_groups_form',
    defaultFormState
  );
  
  const [editId, setEditId, clearEditId] = useHotReload(
    'admin_group_edit_id',
    null as string | null
  );

  const [groups, setGroups] = useState<WhatsappGroup[]>([]);
  const [regions, setRegions] = useState<{ id: string; name?: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WhatsappGroup | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGroups, setFilteredGroups] = useState<WhatsappGroup[]>([]);

  useEffect(() => {
    fetchGroups();
    fetchRegions();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await getWhatsappGroups();
      setGroups(data);
      setFilteredGroups(data);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredGroups(groups);
      return;
    }
    const term = searchTerm.toLowerCase();
    const results = groups.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term) ||
        g.groupType.toLowerCase().includes(term)
    );
    setFilteredGroups(results);
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setFilteredGroups(groups);
  };

  const fetchRegions = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'regions'));
      const regionList = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setRegions(regionList);
    } catch (err) {
      console.error('Error fetching regions:', err);
    }
  };

  const isValidLink = (link: string) => {
    const pattern = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/;
    return pattern.test(link);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    if (!formData.name.trim() || !formData.inviteLink.trim() || !formData.regionId) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (!isValidLink(formData.inviteLink)) {
      setError('Please provide a valid WhatsApp invite link.');
      setLoading(false);
      return;
    }

    try {
      if (editingGroup) {
        await updateWhatsappGroup(editingGroup.id, formData);
      } else {
        await addWhatsappGroup(formData);
      }
      setShowForm(false);
      setEditingGroup(null);
      resetForm();
      await fetchGroups();
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group: WhatsappGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      inviteLink: group.inviteLink,
      regionId: group.regionId,
      memberCount: group.memberCount || 0,
      groupType: group.groupType,
    });
    setShowForm(true);
    setEditId(group.id);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteWhatsappGroup(id);
              await fetchGroups();
            } catch (err) {
              console.error('Error deleting group:', err);
              setError('Failed to delete group');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      inviteLink: '',
      regionId: '',
      memberCount: 0,
      groupType: 'general',
    });
    clearFormData();
    clearEditId();
  };

  const handleFormToggle = () => {
    setShowForm(prev => !prev);
    if (showForm) {
      setEditingGroup(null);
      resetForm();
    }
  };

  const handleJoinGroup = (inviteLink: string) => {
    Linking.openURL(inviteLink).catch(err => {
      console.error('Failed to open WhatsApp link:', err);
      Alert.alert('Error', 'Could not open WhatsApp link');
    });
  };

  // Prepare picker items
  const regionItems = [
    { label: 'Select Region *', value: '' },
    ...regions.map(region => ({
      label: region.name || region.id,
      value: region.id
    }))
  ];

  const groupTypeItems = [
    { label: 'General', value: 'general' },
    { label: 'Book Study', value: 'book-study' },
    { label: 'Events', value: 'events' },
    { label: 'Seva', value: 'seva' },
  ];

  return (
    <View style={rnPageStyles.container}>
      <ScrollView 
        style={rnPageStyles.container}
        contentContainerStyle={rnPageStyles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Sticky Header */}
        <View style={rnPageStyles.stickyHeader}>
          <Text style={rnPageStyles.header}>Admin WhatsApp Groups</Text>

          {/* Search Section */}
          <View style={rnPageStyles.searchContainer}>
            <TextInput
              placeholder="Search groups..."
              style={rnPageStyles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
              editable={!loading}
            />
            <View style={rnPageStyles.searchButtons}>
              <TouchableOpacity
                style={[rnPageStyles.button, loading && rnPageStyles.buttonDisabled]}
                onPress={handleSearch}
                disabled={loading}
              >
                <Text style={rnPageStyles.buttonText}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[rnPageStyles.buttonSecondary, loading && rnPageStyles.buttonDisabled]}
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
                {showForm ? 'Close Form' : 'Add WhatsApp Group'}
              </Text>
            </TouchableOpacity>
            
            <View style={rnPageStyles.statusContainer}>
              <Text style={rnPageStyles.statusText}>
                Groups: {groups.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Error Display */}
        {error ? (
          <View style={{
            backgroundColor: '#fee',
            padding: 16,
            marginBottom: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#fcc',
          }}>
            <Text style={{ color: 'red' }}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        {showForm && (
          <View style={rnPageStyles.form}>
            <Text style={rnPageStyles.cardTitle}>
              {editingGroup ? 'Edit WhatsApp Group' : 'Add WhatsApp Group'}
            </Text>
            
            <TextInput
              placeholder="Group Name *"
              style={rnPageStyles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={!loading}
            />
            
            <TextInput
              placeholder="Description"
              style={[rnPageStyles.input, rnPageStyles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline={true}
              numberOfLines={3}
              editable={!loading}
            />
            
            <TextInput
              placeholder="WhatsApp Invite Link *"
              style={rnPageStyles.input}
              value={formData.inviteLink}
              onChangeText={(text) => setFormData({ ...formData, inviteLink: text })}
              keyboardType="url"
              autoCapitalize="none"
              editable={!loading}
            />
            
            <View style={rnPageStyles.pickerContainer}>
              <Text style={rnPageStyles.label}>Region *</Text>
              <CustomPicker
                selectedValue={formData.regionId}
                onValueChange={(value) => setFormData({ ...formData, regionId: value })}
                items={regionItems}
                placeholder="Select Region *"
                disabled={loading}
              />
            </View>
            
            <TextInput
              placeholder="Member Count"
              style={rnPageStyles.input}
              value={formData.memberCount?.toString() || '0'}
              onChangeText={(text) =>
                setFormData({ ...formData, memberCount: parseInt(text) || 0 })
              }
              keyboardType="numeric"
              editable={!loading}
            />
            
            <View style={rnPageStyles.pickerContainer}>
              <Text style={rnPageStyles.label}>Group Type</Text>
              <CustomPicker
                selectedValue={formData.groupType}
                onValueChange={(value) => 
                  setFormData({ ...formData, groupType: value as WhatsappGroup['groupType'] })
                }
                items={groupTypeItems}
                placeholder="Select Group Type"
                disabled={loading}
              />
            </View>
            
            <View style={rnPageStyles.searchButtons}>
              <TouchableOpacity 
                style={[rnPageStyles.button, loading && rnPageStyles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={rnPageStyles.buttonText}>
                    {editingGroup ? 'Update Group' : 'Add Group'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[rnPageStyles.buttonSecondary, loading && rnPageStyles.buttonDisabled]}
                onPress={handleFormToggle}
                disabled={loading}
              >
                <Text style={rnPageStyles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Groups List */}
        <View style={rnPageStyles.clubsList}>
          {filteredGroups.map((group) => (
            <View key={group.id} style={rnPageStyles.card}>
              <Text style={rnPageStyles.cardTitle}>{group.name}</Text>
              <Text style={rnPageStyles.cardText}>{group.description}</Text>
              
              <TouchableOpacity onPress={() => handleJoinGroup(group.inviteLink)}>
                <Text style={{ color: '#007bff', textDecorationLine: 'underline', marginBottom: 6 }}>
                  Join WhatsApp Group →
                </Text>
              </TouchableOpacity>
              
              <Text style={rnPageStyles.cardText}>
                <Text style={rnPageStyles.cardLabel}>Region: </Text>
                {regions.find(r => r.id === group.regionId)?.name || group.regionId}
              </Text>
              
              <Text style={rnPageStyles.cardText}>
                <Text style={rnPageStyles.cardLabel}>Members: </Text>
                {group.memberCount || 0}
              </Text>
              
              <Text style={rnPageStyles.cardText}>
                <Text style={rnPageStyles.cardLabel}>Type: </Text>
                {group.groupType}
              </Text>
              
              <View style={rnPageStyles.cardActions}>
                <TouchableOpacity 
                  style={[rnPageStyles.buttonSecondary, loading && rnPageStyles.buttonDisabled]}
                  onPress={() => handleEdit(group)}
                  disabled={loading}
                >
                  <Text style={rnPageStyles.buttonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[rnPageStyles.buttonDanger, loading && rnPageStyles.buttonDisabled]}
                  onPress={() => handleDelete(group.id)}
                  disabled={loading}
                >
                  <Text style={rnPageStyles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Empty State */}
        {groups.length === 0 && !loading && (
          <View style={{
            alignItems: 'center',
            padding: 32,
            backgroundColor: '#f9f9f9',
            borderRadius: 8,
            marginTop: 16,
          }}>
            <Text style={{ color: '#666', textAlign: 'center' }}>
              No WhatsApp groups found. Add your first group to get started!
            </Text>
          </View>
        )}

        {/* Loading Indicator */}
        {loading && groups.length === 0 && (
          <View style={{ alignItems: 'center', padding: 32 }}>
            <ActivityIndicator size="large" color={colors.churchOrange} />
            <Text style={{ marginTop: 8, color: '#666' }}>Loading groups...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AdminGroups;