import React, { useEffect, useState } from 'react';
import {
  addReadingClub,
  updateReadingClub,
  deleteReadingClub,
  getReadingClubs,
  getRegions,
} from '../services/ReadingClubService';
import { ReadingClub } from '../models/ReadingClub.model';
import { pageStyles } from '@/css/page';

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
  const [clubs, setClubs] = useState<ReadingClub[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(defaultFormState);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    loadClubs();
    loadRegions();
  }, []);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const location = prev.location ?? { address: '', latitude: 0, longitude: 0 };
      return {
        ...prev,
        location: {
          address: name === 'address' ? value : location.address,
          latitude: name === 'latitude' ? parseFloat(value) : location.latitude,
          longitude: name === 'longitude' ? parseFloat(value) : location.longitude,
        },
      };
    });
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (window.confirm('Are you sure you want to delete this club?')) {
      try {
        await deleteReadingClub(id);
        await loadClubs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.header}>Admin Reading Clubs</h1>

      <button style={pageStyles.button} onClick={() => setShowForm((prev) => !prev)}>
        {showForm ? 'Close Form' : 'Add Reading Club'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={pageStyles.form}>
          <input
            name="name"
            placeholder="Club Name"
            style={pageStyles.input}
            value={formData.name}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            style={pageStyles.input}
            value={formData.description}
            onChange={handleChange}
            required
          />
          <select
            name="meetingType"
            style={pageStyles.select}
            value={formData.meetingType}
            onChange={handleChange}
          >
            <option value="online">Online</option>
            <option value="in-person">In-Person</option>
            <option value="hybrid">Hybrid</option>
          </select>

          <input
            name="address"
            placeholder="Location Address"
            style={pageStyles.input}
            value={formData.location?.address || ''}
            onChange={handleLocationChange}
          />
          <input
            name="latitude"
            placeholder="Latitude"
            type="number"
            style={pageStyles.input}
            value={formData.location?.latitude || 0}
            onChange={handleLocationChange}
          />
          <input
            name="longitude"
            placeholder="Longitude"
            type="number"
            style={pageStyles.input}
            value={formData.location?.longitude || 0}
            onChange={handleLocationChange}
          />

          <input
            name="day"
            placeholder="Day"
            style={pageStyles.input}
            value={formData.schedule.day}
            onChange={handleScheduleChange}
          />
          <input
            name="time"
            placeholder="Time"
            type="time"
            style={pageStyles.input}
            value={formData.schedule.time}
            onChange={handleScheduleChange}
          />
          <select
            name="frequency"
            style={pageStyles.select}
            value={formData.schedule.frequency}
            onChange={handleScheduleChange}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <input
            name="currentBook"
            placeholder="Current Book"
            style={pageStyles.input}
            value={formData.currentBook || ''}
            onChange={handleChange}
          />

          <select
            name="regionId"
            style={pageStyles.select}
            value={formData.regionId}
            onChange={handleChange}
            required
          >
            <option value="">Select a Region</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>

          <input
            name="facilitatorName"
            placeholder="Facilitator Name"
            style={pageStyles.input}
            value={formData.facilitator.name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                facilitator: { ...prev.facilitator, name: e.target.value },
              }))
            }
          />
          <input
            name="facilitatorContact"
            placeholder="Facilitator Contact"
            style={pageStyles.input}
            value={formData.facilitator.contact}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                facilitator: { ...prev.facilitator, contact: e.target.value },
              }))
            }
          />

          <button type="submit" style={pageStyles.button}>
            {editId ? 'Update Club' : 'Add Club'}
          </button>
        </form>
      )}

      <div style={pageStyles.cardGrid}>
        {clubs.map((club) => (
          <div key={club.id} style={pageStyles.card}>
            <h3 style={pageStyles.cardTitle}>{club.name}</h3>
            <p style={pageStyles.cardText}>{club.description}</p>
            <p style={pageStyles.cardText}><strong>Meeting Type:</strong> {club.meetingType}</p>
            {club.location?.address && (
              <p style={pageStyles.cardText}><strong>Location:</strong> {club.location.address}</p>
            )}
            <p style={pageStyles.cardText}>
              <strong>Schedule:</strong> {club.schedule.day} at {club.schedule.time} ({club.schedule.frequency})
            </p>
            {club.currentBook && (
              <p style={pageStyles.cardText}><strong>Current Book:</strong> {club.currentBook}</p>
            )}
            <p style={pageStyles.cardText}>
              <strong>Facilitator:</strong> {club.facilitator.name} ({club.facilitator.contact})
            </p>
            <button style={pageStyles.buttonSecondary} onClick={() => handleEdit(club)}>Edit</button>
            <button
              style={{ ...pageStyles.buttonDanger, marginLeft: '0.5rem' }}
              onClick={() => handleDelete(club.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminClubs;
