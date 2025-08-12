import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Region } from '../models/region.model';
import {
  addRegion,
  getRegions,
  updateRegion,
  deleteRegion,
} from '../services/regionService';

const AdminRegions: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);

  const [formData, setFormData] = useState<Omit<Region, 'id'>>({
    name: '',
    description: '',
    location: { latitude: 0, longitude: 0 },
    whatsappGroups: [],
    ReadingClubs: [],
    numberoftemples: undefined,
  });

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    const data = await getRegions();
    setRegions(data);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'numberoftemples'
          ? value === '' ? undefined : parseInt(value, 10)
          : value,
    }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: parseFloat(value),
      },
    }));
  };

  const handleReadingClubsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      ReadingClubs: value ? value.split(',').map((club) => club.trim()) : [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRegion) {
      await updateRegion(editingRegion.id, formData);
    } else {
      await addRegion(formData);
    }

    setShowForm(false);
    setEditingRegion(null);
    resetForm();
    loadRegions();
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
    await deleteRegion(id);
    loadRegions();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: { latitude: 0, longitude: 0 },
      whatsappGroups: [],
      ReadingClubs: [],
      numberoftemples: undefined,
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Regions</h1>
      <button onClick={() => {
        setShowForm(!showForm);
        if (!showForm) {
          setEditingRegion(null);
          resetForm();
        }
      }}>
        {showForm ? 'Close Form' : 'Add Region'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
          <div>
            <label>Name:</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label>Latitude:</label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={formData.location.latitude}
              onChange={handleLocationChange}
              required
            />
          </div>

          <div>
            <label>Longitude:</label>
            <input
              type="number"
              step="any"
              name="longitude"
              value={formData.location.longitude}
              onChange={handleLocationChange}
              required
            />
          </div>


          <div>
            <label>Number of Temples:</label>
            <input
              type="number"
              name="numberoftemples"
              value={formData.numberoftemples ?? ''}
              onChange={handleInputChange}
            />
          </div>

          <button type="submit">
            {editingRegion ? 'Update Region' : 'Save Region'}
          </button>
        </form>
      )}

      <div style={{ marginTop: '30px', display: 'grid', gap: '15px' }}>
        {regions.map((region) => (
          <div key={region.id} style={{ border: '1px solid #ccc', padding: '15px' }}>
            <h3>{region.name}</h3>
            <p>{region.description}</p>
            <small>
              Location: {region.location.latitude}, {region.location.longitude}
            </small>
            <br />
            <p>Number of Temples: {region.numberoftemples ?? 'N/A'}</p>
            <p>WhatsApp Groups: {region.whatsappGroups?.length || 0}</p>
            <p>Reading Clubs: {region.ReadingClubs?.join(', ') || 'None'}</p>

            <div style={{ marginTop: '10px' }}>
              <button onClick={() => handleEdit(region)}>Edit</button>
              <button onClick={() => handleDelete(region.id)} style={{ marginLeft: '10px', color: 'red' }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRegions;
