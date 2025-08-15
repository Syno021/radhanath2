import React, { useEffect, useState } from 'react';
import { Region } from '../models/region.model';
import { addRegion, getRegions, updateRegion, deleteRegion } from '../services/regionService';
import { pageStyles } from '../css/page';

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

  useEffect(() => { loadRegions(); }, []);

  const loadRegions = async () => {
    const data = await getRegions();
    setRegions(data);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'numberoftemples'
        ? value === '' ? undefined : parseInt(value, 10)
        : value,
    }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [name]: parseFloat(value) },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRegion) await updateRegion(editingRegion.id, formData);
    else await addRegion(formData);
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
    <div style={pageStyles.container}>
      <h1 style={pageStyles.header}>Admin Regions</h1>
      <button
        style={pageStyles.button}
        onClick={() => { setShowForm(!showForm); if (!showForm) { setEditingRegion(null); resetForm(); } }}
      >
        {showForm ? 'Close Form' : 'Add Region'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={pageStyles.form}>
          <input style={pageStyles.input} name="name" value={formData.name} onChange={handleInputChange} placeholder="Region Name" required />
          <textarea style={pageStyles.textarea} name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" />
          <input style={pageStyles.input} type="number" step="any" name="latitude" value={formData.location.latitude} onChange={handleLocationChange} placeholder="Latitude" required />
          <input style={pageStyles.input} type="number" step="any" name="longitude" value={formData.location.longitude} onChange={handleLocationChange} placeholder="Longitude" required />
          <input style={pageStyles.input} type="number" name="numberoftemples" value={formData.numberoftemples ?? ''} onChange={handleInputChange} placeholder="Number of Temples" />
          <button style={pageStyles.button} type="submit">{editingRegion ? 'Update Region' : 'Save Region'}</button>
        </form>
      )}

      <div style={pageStyles.cardGrid}>
        {regions.map((region) => (
          <div key={region.id} style={pageStyles.card}>
            <h3 style={pageStyles.cardTitle}>{region.name}</h3>
            <p style={pageStyles.cardText}>{region.description}</p>
            <p style={pageStyles.cardText}> {region.location.latitude}, {region.location.longitude}</p>
            <p style={pageStyles.cardText}>Temples: {region.numberoftemples ?? 'N/A'}</p>
            <p style={pageStyles.cardText}>WhatsApp Groups: {region.whatsappGroups?.length || 0}</p>
            <p style={pageStyles.cardText}>Reading Clubs: {region.ReadingClubs?.join(', ') || 'None'}</p>
            <button style={pageStyles.buttonSecondary} onClick={() => handleEdit(region)}>Edit</button>
            <button style={pageStyles.buttonDanger} onClick={() => handleDelete(region.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRegions;
