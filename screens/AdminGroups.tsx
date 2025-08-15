import React, { useEffect, useState } from 'react';
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

const AdminGroups: React.FC = () => {
  const [groups, setGroups] = useState<WhatsappGroup[]>([]);
  const [regions, setRegions] = useState<{ id: string; name?: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WhatsappGroup | null>(null);
  const [formData, setFormData] = useState<Omit<WhatsappGroup, 'id'>>({
    name: '',
    description: '',
    inviteLink: '',
    regionId: '',
    memberCount: 0,
    groupType: 'general',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchRegions();
  }, []);

  const fetchGroups = async () => {
    const data = await getWhatsappGroups();
    setGroups(data);
  };

  const fetchRegions = async () => {
    const snapshot = await getDocs(collection(db, 'regions'));
    const regionList = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
    setRegions(regionList);
  };

  const isValidLink = (link: string) => {
    const pattern = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/;
    return pattern.test(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.inviteLink.trim() || !formData.regionId) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isValidLink(formData.inviteLink)) {
      setError('Please provide a valid WhatsApp invite link.');
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
      fetchGroups();
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
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
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      await deleteWhatsappGroup(id);
      fetchGroups();
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
  };

  return (
    <div style={pageStyles.container}>
      <h2 style={pageStyles.header}>Admin - WhatsApp Groups</h2>
      <button
        style={pageStyles.button}
        onClick={() => {
          setShowForm(!showForm);
          if (!showForm) {
            setEditingGroup(null);
            resetForm();
          }
        }}
      >
        {showForm ? 'Close Form' : 'Add WhatsApp Group'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={pageStyles.form}>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <input
            type="text"
            placeholder="Group Name"
            style={pageStyles.input}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            style={pageStyles.input}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <input
            type="text"
            placeholder="Invite Link"
            style={pageStyles.input}
            value={formData.inviteLink}
            onChange={(e) => setFormData({ ...formData, inviteLink: e.target.value })}
          />
          <select
            style={pageStyles.select}
            value={formData.regionId}
            onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
          >
            <option value="">Select Region</option>
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
          <button type="submit" style={pageStyles.button}>
            {editingGroup ? 'Update Group' : 'Add Group'}
          </button>
        </form>
      )}

      <div style={pageStyles.cardGrid}>
        {groups.map((group) => (
          <div key={group.id} style={pageStyles.card}>
            <h4 style={pageStyles.cardTitle}>{group.name}</h4>
            <p style={pageStyles.cardText}>{group.description}</p>
            <a href={group.inviteLink} target="_blank" rel="noopener noreferrer">
              Join Link
            </a>
            <p style={pageStyles.cardText}><strong>Region:</strong> {group.regionId}</p>
            <p style={pageStyles.cardText}><strong>Members:</strong> {group.memberCount || 0}</p>
            <p style={pageStyles.cardText}><strong>Type:</strong> {group.groupType}</p>
            <button style={pageStyles.buttonSecondary} onClick={() => handleEdit(group)}>Edit</button>
            <button style={{ ...pageStyles.buttonDanger, marginLeft: '0.5rem' }} onClick={() => handleDelete(group.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGroups;
