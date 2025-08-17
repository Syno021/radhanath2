import React, { useEffect, useState } from 'react';
import { useScrollable, useHotReload, useScrollRestore } from '../services/ScrollableService';
import { enhancedContainerStyles } from '../services/ScrollableService.css';
import {
  getWhatsappGroups,
  addWhatsappGroup,
  updateWhatsappGroup,
  deleteWhatsappGroup,
} from '../services/WhatsappGroupService';
import { WhatsappGroup } from '../models/whatsappGroup.model';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseCo';
import { pageStyles } from '@/css/page';

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
  const {
    containerRef,
    scrollToTop,
    scrollToBottom, 
    scrollToElement,
    scrollToPosition,
    isScrollable,
    scrollPosition,
    scrollPercentage,
    isAtTop,
    isAtBottom,
  } = useScrollable({
    enableSmoothScrolling: true,
    customScrollbarStyles: true,
    preventHorizontalScroll: true,
    scrollThreshold: 50,
    saveScrollPosition: true,
  }, 'admin_groups');
  
  const [formData, setFormData, clearFormData] = useHotReload(
    'admin_groups_form', // Fixed typo: was 'admin_groupd_form'
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
      setFilteredGroups(data); // initialize filtered list
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (window.confirm('Are you sure you want to delete this group?')) {
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
    }
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

  return (
    <div ref={containerRef} style={enhancedContainerStyles}>
      {/* Optional: Add scroll progress bar */}
      {isScrollable && (
        <div className="scroll-progress">
          <div 
            className="scroll-progress-bar" 
            style={{ width: `${scrollPercentage}%` }}
          />
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          position: 'sticky', 
          top: 0, 
          backgroundColor: 'white', 
          zIndex: 10, 
          paddingBottom: '1rem',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '1rem'
        }}>
          <h1 style={pageStyles.header}>Admin WhatsApp Groups</h1>

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search groups..."
              style={pageStyles.input}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              style={pageStyles.button}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </button>
            <button
              style={pageStyles.buttonSecondary}
              onClick={handleResetSearch}
              disabled={loading}
            >
              Reset
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              style={pageStyles.button} 
              onClick={handleFormToggle}
              disabled={loading}
            >
              {showForm ? 'Close Form' : 'Add WhatsApp Group'}
            </button>
            
            {/* Enhanced scroll buttons with more features */}
            {isScrollable && (
              <div className="scroll-buttons">
                <button 
                  className="scroll-button"
                  onClick={scrollToTop}
                  disabled={isAtTop}
                  title="Scroll to top"
                >
                  ↑ Top
                </button>
                <button 
                  className="scroll-button"
                  onClick={scrollToBottom}
                  disabled={isAtBottom}
                  title="Scroll to bottom"
                >
                  ↓ Bottom
                </button>
                {/* New: Quick jump to form */}
                {showForm && (
                  <button 
                    className="scroll-button"
                    onClick={() => scrollToElement('group-form')}
                    title="Jump to form"
                  >
                    → Form
                  </button>
                )}
              </div>
            )}
            
            {/* Enhanced status display */}
            <div style={{ fontSize: '0.8rem', color: '#888', marginLeft: 'auto' }}>
              Groups: {groups.length} | 
              Scroll: {Math.round(scrollPercentage)}% | 
              Pos: {Math.round(scrollPosition)}px
              {isScrollable && (
                <>
                  {isAtTop && ' | At Top'}
                  {isAtBottom && ' | At Bottom'}
                </>
              )}
            </div>
          </div>
        </div>

        <div style={pageStyles.container}>
          {error && (
            <div style={{ 
              color: 'red', 
              backgroundColor: '#fee', 
              padding: '1rem', 
              marginBottom: '1rem',
              borderRadius: '4px',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          {showForm && (
            <form 
              id="group-form"
              onSubmit={handleSubmit} 
              style={{...pageStyles.form, marginBottom: '2rem'}}
            >
              <h3>{editingGroup ? 'Edit WhatsApp Group' : 'Add WhatsApp Group'}</h3>
              
              <input
                type="text"
                placeholder="Group Name *"
                style={pageStyles.input}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              
              <textarea
                placeholder="Description"
                style={pageStyles.input}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              
              <input
                type="url"
                placeholder="WhatsApp Invite Link *"
                style={pageStyles.input}
                value={formData.inviteLink}
                onChange={(e) => setFormData({ ...formData, inviteLink: e.target.value })}
                required
              />
              
              <select
                style={pageStyles.select}
                value={formData.regionId}
                onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                required
              >
                <option value="">Select Region *</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name || region.id}
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Member Count"
                style={pageStyles.input}
                value={formData.memberCount || 0}
                onChange={(e) =>
                  setFormData({ ...formData, memberCount: parseInt(e.target.value) || 0 })
                }
                min="0"
              />
              
              <select
                style={pageStyles.select}
                value={formData.groupType}
                onChange={(e) =>
                  setFormData({ ...formData, groupType: e.target.value as WhatsappGroup['groupType'] })
                }
              >
                <option value="general">General</option>
                <option value="book-study">Book Study</option>
                <option value="events">Events</option>
                <option value="seva">Seva</option>
              </select>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="submit" 
                  style={pageStyles.button}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingGroup ? 'Update Group' : 'Add Group')}
                </button>
                
                <button 
                  type="button" 
                  style={pageStyles.buttonSecondary}
                  onClick={handleFormToggle}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div style={pageStyles.cardGrid}>
            {filteredGroups.map((group) => (
              <div key={group.id} style={pageStyles.card}>
                <h4 style={pageStyles.cardTitle}>{group.name}</h4>
                <p style={pageStyles.cardText}>{group.description}</p>
                <a 
                  href={group.inviteLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#007bff', textDecoration: 'none' }}
                >
                  Join WhatsApp Group →
                </a>
                <p style={pageStyles.cardText}>
                  <strong>Region:</strong> {regions.find(r => r.id === group.regionId)?.name || group.regionId}
                </p>
                <p style={pageStyles.cardText}>
                  <strong>Members:</strong> {group.memberCount || 0}
                </p>
                <p style={pageStyles.cardText}>
                  <strong>Type:</strong> {group.groupType}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button 
                    style={pageStyles.buttonSecondary} 
                    onClick={() => handleEdit(group)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button 
                    style={pageStyles.buttonDanger} 
                    onClick={() => handleDelete(group.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {groups.length === 0 && !loading && (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '2rem',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px'
            }}>
              No WhatsApp groups found. Add your first group to get started!
            </div>
          )}
        </div>
      </div>
    </div>  
  );
};

export default AdminGroups;