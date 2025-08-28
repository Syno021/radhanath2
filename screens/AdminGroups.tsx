import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from "@expo/vector-icons";
import { useScrollable, useHotReload, useScrollRestore } from '../services/ScrollableService';
import {
  getWhatsappGroups,
  addWhatsappGroup,
  updateWhatsappGroup,
  deleteWhatsappGroup,
} from '../services/WhatsappGroupService';
import { WhatsappGroup } from '../models/whatsappGroup.model';
import { collection, getDocs, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseCo';
import GuideOverlay from '../components/GuideOverlay';

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
  const scrollViewRef = useRef<ScrollView>(null);
  
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
  const [showGuide, setShowGuide] = useState(false);

  const guideSteps = [
    {
      title: "Create WhatsApp Group",
      description: "Add new WhatsApp groups by entering the group name, description, and invite link.",
      icon: "add-circle-outline"
    },
    {
      title: "Manage Regions",
      description: "Assign groups to specific regions to help devotees find local communities.",
      icon: "map-outline"
    },
    {
      title: "Group Types",
      description: "Categorize groups as General, Book Study, Events, or Seva for better organization.",
      icon: "list-outline"
    },
    {
      title: "Monitor Activity",
      description: "Track member counts and manage group information to keep everything up to date.",
      icon: "stats-chart-outline"
    }
  ];

  useEffect(() => {
    fetchGroups();
    fetchRegions();
  }, []);

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

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
    
    // Scroll to top when editing
    scrollToTop();
  };

  const handleDelete = async (id: string) => {
    // Get the group data to find the regionId before deletion
    const groupToDelete = groups.find(g => g.id === id);
    
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
              // 1. Delete from whatsapp-groups collection
              await deleteWhatsappGroup(id);
              
              // 2. Remove from region's whatsappGroups array if regionId exists
              if (groupToDelete?.regionId) {
                const regionRef = doc(db, 'regions', groupToDelete.regionId);
                await updateDoc(regionRef, {
                  whatsappGroups: arrayRemove(id),
                });
              }
              
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

  const getGroupTypeIcon = (groupType: string) => {
    switch (groupType) {
      case 'book-study':
        return 'book-outline';
      case 'events':
        return 'calendar-outline';
      case 'seva':
        return 'heart-outline';
      default:
        return 'people-outline';
    }
  };

  const getGroupTypeColor = (groupType: string) => {
    switch (groupType) {
      case 'book-study':
        return '#4CAF50';
      case 'events':
        return '#2196F3';
      case 'seva':
        return '#E91E63';
      default:
        return '#FF6B00';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>WhatsApp Groups</Text>
          <Text style={styles.headerSubtitle}>BBT Africa Connect - Admin</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => setShowGuide(true)}
          >
            <Ionicons name="help-circle-outline" size={24} color="#FF6B00" />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Ionicons name="chatbubbles-outline" size={24} color="#FF6B00" />
          </View>
        </View>
      </View>

      <GuideOverlay
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        steps={guideSteps}
        screenName="WhatsApp Group Management"
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Groups</Text>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                placeholder="Search groups..."
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
                activeOpacity={0.9}
              >
                <Ionicons name="search" size={16} color="#FFFFFF" />
                <Text style={styles.buttonText}>Search</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                onPress={handleResetSearch}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color="#FF6B00" />
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <Text style={styles.statValue}>{groups.length}</Text>
              <Text style={styles.statLabel}>Total Groups</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statValue}>{filteredGroups.length}</Text>
              <Text style={styles.statLabel}>Showing</Text>
            </View>
          </View>
        </View>

        {/* Add Group Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleFormToggle}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Ionicons name={showForm ? "close" : "add-circle-outline"} size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {showForm ? 'Close Form' : 'Add WhatsApp Group'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Display */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        {showForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {editingGroup ? 'Edit WhatsApp Group' : 'Add WhatsApp Group'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Group Name</Text>
              <TextInput
                placeholder="Enter group name"
                placeholderTextColor="#999"
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                editable={!loading}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Enter group description"
                placeholderTextColor="#999"
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline={true}
                numberOfLines={3}
                editable={!loading}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>WhatsApp Invite Link</Text>
              <TextInput
                placeholder="https://chat.whatsapp.com/..."
                placeholderTextColor="#999"
                style={styles.input}
                value={formData.inviteLink}
                onChangeText={(text) => setFormData({ ...formData, inviteLink: text })}
                keyboardType="url"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Region</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.regionId}
                  onValueChange={(itemValue) =>
                    setFormData({ ...formData, regionId: itemValue })
                  }
                  enabled={!loading}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Region" value="" />
                  {regions.map((region) => (
                    <Picker.Item 
                      key={region.id} 
                      label={region.name || region.id} 
                      value={region.id} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Member Count</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={formData.memberCount?.toString() || '0'}
                  onChangeText={(text) =>
                    setFormData({ ...formData, memberCount: parseInt(text) || 0 })
                  }
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
              
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Group Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.groupType}
                    onValueChange={(itemValue) =>
                      setFormData({ ...formData, groupType: itemValue as WhatsappGroup['groupType'] })
                    }
                    enabled={!loading}
                    style={styles.picker}
                  >
                    <Picker.Item label="General" value="general" />
                    <Picker.Item label="Book Study" value="book-study" />
                    <Picker.Item label="Events" value="events" />
                    <Picker.Item label="Seva" value="seva" />
                  </Picker>
                </View>
              </View>
            </View>
            
            <View style={styles.formButtons}>
              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>
                      {editingGroup ? 'Update Group' : 'Add Group'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                onPress={handleFormToggle}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={20} color="#FF6B00" />
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Groups List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Groups ({filteredGroups.length})</Text>
          
          {filteredGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <View style={styles.groupTypeBadge}>
                    <Ionicons 
                      name={getGroupTypeIcon(group.groupType)} 
                      size={14} 
                      color={getGroupTypeColor(group.groupType)} 
                    />
                    <Text style={[styles.groupTypeText, { color: getGroupTypeColor(group.groupType) }]}>
                      {group.groupType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.memberBadge}>
                  <Ionicons name="people" size={14} color="#666" />
                  <Text style={styles.memberCount}>{group.memberCount || 0}</Text>
                </View>
              </View>
              
              {group.description && (
                <Text style={styles.groupDescription}>{group.description}</Text>
              )}
              
              <View style={styles.groupMeta}>
                <Text style={styles.groupRegion}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  {' '}{regions.find(r => r.id === group.regionId)?.name || group.regionId}
                </Text>
                
                <TouchableOpacity 
                  onPress={() => handleJoinGroup(group.inviteLink)}
                  style={styles.joinButton}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                  <Text style={styles.joinButtonText}>Join Group</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.groupActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(group)}
                  disabled={loading}
                >
                  <Ionicons name="pencil" size={16} color="#FF6B00" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(group.id)}
                  disabled={loading}
                >
                  <Ionicons name="trash" size={16} color="#FF4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Empty State */}
        {groups.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#DDD" />
            <Text style={styles.emptyStateText}>No WhatsApp groups yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first group to help devotees connect with their local community
            </Text>
          </View>
        )}

        {/* Loading Indicator */}
        {loading && groups.length === 0 && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FDFCFA',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '300',
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF4E6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpButton: {
    marginRight: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#1A1A1A',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  searchButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statBadge: {
    flex: 1,
    backgroundColor: '#FFF4E6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  statValue: {
    fontSize: 20,
    color: '#FF6B00',
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    elevation: 3,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonDisabled: {
    backgroundColor: '#FFB380',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.3,
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  errorText: {
    color: '#FF4444',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
    color: '#1A1A1A',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  groupCard: {
    backgroundColor: '#FFF9F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    marginBottom: 4,
  },
  groupTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  groupTypeText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  groupMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupRegion: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#25D366',
  },
  joinButtonText: {
    fontSize: 12,
    color: '#25D366',
    fontWeight: '500',
    marginLeft: 4,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  editButtonText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  deleteButtonText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '400',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '300',
  },
  loadingState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    fontWeight: '300',
  },
});

export default AdminGroups;