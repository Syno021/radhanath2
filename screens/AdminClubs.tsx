import React, { useEffect, useState } from 'react';
import { useScrollable, useHotReload, useScrollRestore } from '../services/ScrollableService';
import {enhancedContainerStyles} from '../services/ScrollableService.css';
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

  // Your existing call gets enhanced features automatically:
const {
  containerRef,
  scrollToTop,
  scrollToBottom, 
  scrollToElement,
  scrollToPosition, // NEW
  isScrollable,
  scrollPosition,
  scrollPercentage, // NEW
  isAtTop, // NEW  
  isAtBottom, // NEW
} = useScrollable({
  enableSmoothScrolling: true,
  customScrollbarStyles: true,
  preventHorizontalScroll: true,
  scrollThreshold: 50, // NEW - customize when isAtTop/isAtBottom trigger
  saveScrollPosition: true, // NEW - auto-save scroll position
}, 'admin_clubs');


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
  //const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");   // 🔎 search state
  const [filteredClubs, setFilteredClubs] = useState<ReadingClub[]>([]);


  useEffect(() => {
    loadClubs();
    loadRegions();
  }, []);

  useEffect(() => {
    handleFilter(); // apply filter whenever clubs or searchTerm changes
  }, [clubs, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <h1 style={pageStyles.header}>Admin Reading Clubs</h1>
          
          {/* 🔎 Search Bar & Filter */}
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
          >
            <input
              type="text"
              placeholder="Search by name, description, book, facilitator..."
              style={pageStyles.input}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button type="submit" style={pageStyles.button}>
              Search
            </button>
            <button
              type="button"
              style={pageStyles.buttonSecondary}
              onClick={() => setSearchTerm("")}
            >
              Reset
            </button>
          </form>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              style={pageStyles.button} 
              onClick={() => setShowForm((prev) => !prev)}
              disabled={loading}
            >
              {showForm ? 'Close Form' : 'Add Reading Club'}
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
                    onClick={() => scrollToElement('club-form')}
                    title="Jump to form"
                  >
                    → Form
                  </button>
                )}
              </div>
            )}
            
            {/* Enhanced status display */}
            <div style={{ fontSize: '0.8rem', color: '#888', marginLeft: 'auto' }}>
              Clubs: {clubs.length} | 
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

        {/* Rest of your existing JSX remains the same */}
        {/* ... */}
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

      {/* 📋 Render filtered list instead of all clubs */}
          <div style={pageStyles.cardGrid}>
            {filteredClubs.map((club) => (
              <div key={club.id} style={pageStyles.card}>
                <h3 style={pageStyles.cardTitle}>{club.name}</h3>
                <p style={pageStyles.cardText}>{club.description}</p>
                <p style={pageStyles.cardText}>
                  <strong>Meeting Type:</strong> {club.meetingType}
                </p>
                {club.location?.address && (
                  <p style={pageStyles.cardText}>
                    <strong>Location:</strong> {club.location.address}
                  </p>
                )}
                <p style={pageStyles.cardText}>
                  <strong>Schedule:</strong> {club.schedule.day} at{" "}
                  {club.schedule.time} ({club.schedule.frequency})
                </p>
                {club.currentBook && (
                  <p style={pageStyles.cardText}>
                    <strong>Current Book:</strong> {club.currentBook}
                  </p>
                )}
                <p style={pageStyles.cardText}>
                  <strong>Facilitator:</strong> {club.facilitator.name} (
                  {club.facilitator.contact})
                </p>
                <button
                  style={pageStyles.buttonSecondary}
                  onClick={() => handleEdit(club)}
                >
                  Edit
                </button>
                <button
                  style={{ ...pageStyles.buttonDanger, marginLeft: "0.5rem" }}
                  onClick={() => handleDelete(club.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>


    
  );
};

export default AdminClubs;
