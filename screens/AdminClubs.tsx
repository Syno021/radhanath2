// pages/AdminClubs.tsx
import React, { useEffect, useState } from 'react';
import {
  addReadingClub,
  updateReadingClub,
  deleteReadingClub,
  getReadingClubs,
  getRegions, // NEW
} from '../services/ReadingClubService';
import { ReadingClub } from '../models/ReadingClub.model';

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
  const [regions, setRegions] = useState<Region[]>([]); // NEW
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(defaultFormState);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    loadClubs();
    loadRegions(); // NEW
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
    <div style={{ padding: '1rem' }}>
      <h1>Admin Reading Clubs</h1>

      <button onClick={() => setShowForm((prev) => !prev)}>
        {showForm ? 'Close Form' : 'Add Reading Club'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem', border: '1px solid #ccc', padding: '1rem' }}>
          <input
            name="name"
            placeholder="Club Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
          />
          <select name="meetingType" value={formData.meetingType} onChange={handleChange}>
            <option value="online">Online</option>
            <option value="in-person">In-Person</option>
            <option value="hybrid">Hybrid</option>
          </select>

          <input
            name="address"
            placeholder="Location Address"
            value={formData.location?.address || ''}
            onChange={handleLocationChange}
          />
          <input
            name="latitude"
            placeholder="Latitude"
            type="number"
            value={formData.location?.latitude || 0}
            onChange={handleLocationChange}
          />
          <input
            name="longitude"
            placeholder="Longitude"
            type="number"
            value={formData.location?.longitude || 0}
            onChange={handleLocationChange}
          />

          <input
            name="day"
            placeholder="Day"
            value={formData.schedule.day}
            onChange={handleScheduleChange}
          />
          <input
            name="time"
            placeholder="Time"
            type="time"
            value={formData.schedule.time}
            onChange={handleScheduleChange}
          />
          <select
            name="frequency"
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
            value={formData.currentBook || ''}
            onChange={handleChange}
          />

          {/* NEW REGION SELECT */}
          <select
            name="regionId"
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
            value={formData.facilitator.contact}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                facilitator: { ...prev.facilitator, contact: e.target.value },
              }))
            }
          />

          <button type="submit">{editId ? 'Update Club' : 'Add Club'}</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        {clubs.map((club) => (
          <div key={club.id} style={{ border: '1px solid #ccc', padding: '1rem' }}>
            <h3>{club.name}</h3>
            <p>{club.description}</p>
            <p><strong>Meeting Type:</strong> {club.meetingType}</p>
            {club.location?.address && <p><strong>Location:</strong> {club.location.address}</p>}
            <p><strong>Schedule:</strong> {club.schedule.day} at {club.schedule.time} ({club.schedule.frequency})</p>
            {club.currentBook && <p><strong>Current Book:</strong> {club.currentBook}</p>}
            <p><strong>Facilitator:</strong> {club.facilitator.name} ({club.facilitator.contact})</p>
            <button onClick={() => handleEdit(club)}>Edit</button>
            <button onClick={() => handleDelete(club.id)} style={{ marginLeft: '0.5rem', color: 'red' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminClubs;
