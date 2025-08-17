import React, { useEffect, useState } from 'react';
import { useScrollable, useHotReload } from '../services/ScrollableService';
import { enhancedContainerStyles } from '../services/ScrollableService.css';
import { Region } from '../models/region.model';
import { addRegion, getRegions, updateRegion, deleteRegion } from '../services/regionService';
import { pageStyles } from '../css/page';

const defaultFormState: Omit<Region, 'id'> = {
  name: '',
  description: '',
  location: { latitude: 0, longitude: 0 },
  whatsappGroups: [],
  ReadingClubs: [],
  numberoftemples: undefined,
};

const AdminRegions: React.FC = () => {
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
  } = useScrollable(
    {
      enableSmoothScrolling: true,
      customScrollbarStyles: true,
      preventHorizontalScroll: true,
      scrollThreshold: 50,
      saveScrollPosition: true,
    }, 
    'admin_regions'
  );
    
  const [formData, setFormData] = useHotReload(
    'admin_regions_form',
    defaultFormState
  );
    
  const [editId, setEditId] = useHotReload(
    'admin_regions_edit_id',
    null as string | null
  );

  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);

  useEffect(() => { loadRegions(); }, []);

  const loadRegions = async () => {
    try {
      const data = await getRegions();
      setRegions(data);
      setFilteredRegions(data); // keep both original & filtered
    } catch (err) {
      setError('Failed to load regions');
    }
  };

  // 🔍 Search function
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredRegions(regions);
      return;
    }
    const filtered = regions.filter((region) =>
      region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.ReadingClubs?.some(club => club.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredRegions(filtered);
  };

  // ♻️ Reset search
  const handleResetSearch = () => {
    setSearchTerm('');
    setFilteredRegions(regions);
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
    try {
      if (editingRegion) {
        await updateRegion(editingRegion.id, formData);
      } else {
        await addRegion(formData);
      }
      setShowForm(false);
      setEditingRegion(null);
      resetForm();
      loadRegions();
    } catch (err) {
      setError('Failed to save region');
    }
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
    try {
      await deleteRegion(id);
      loadRegions();
    } catch (err) {
      setError('Failed to delete region');
    }
  };

  const resetForm = () => {
    setFormData(defaultFormState);
  };

  const handleFormToggle = () => {
    setShowForm((prev) => !prev);
    if (!showForm) resetForm(); // clear form on open
  };

  return (
    <div ref={containerRef} style={enhancedContainerStyles}>
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
          <h1 style={pageStyles.header}>Admin Regions</h1>

          {/* 🔍 Search Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              style={pageStyles.input}
              type="text"
              placeholder="Search regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button style={pageStyles.button} onClick={handleSearch}>Search</button>
            <button style={pageStyles.buttonSecondary} onClick={handleResetSearch}>Reset</button>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              style={pageStyles.button} 
              onClick={handleFormToggle}
              disabled={loading}
            >
              {showForm ? 'Close Form' : 'Add Region'}
            </button>
            
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
                {showForm && (
                  <button 
                    className="scroll-button"
                    onClick={() => scrollToElement('region-form')}
                    title="Jump to form"
                  >
                    → Form
                  </button>
                )}
              </div>
            )}
            
            <div style={{ fontSize: '0.8rem', color: '#888', marginLeft: 'auto' }}>
              Groups: {regions.length} | 
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
            <form id="region-form" onSubmit={handleSubmit} style={pageStyles.form}>
              <input style={pageStyles.input} name="name" value={formData.name} onChange={handleInputChange} placeholder="Region Name" required />
              <textarea style={pageStyles.textarea} name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" />
              <input style={pageStyles.input} type="number" step="any" name="latitude" value={formData.location.latitude} onChange={handleLocationChange} placeholder="Latitude" required />
              <input style={pageStyles.input} type="number" step="any" name="longitude" value={formData.location.longitude} onChange={handleLocationChange} placeholder="Longitude" required />
              <input style={pageStyles.input} type="number" name="numberoftemples" value={formData.numberoftemples ?? ''} onChange={handleInputChange} placeholder="Number of Temples" />
              <button style={pageStyles.button} type="submit">{editingRegion ? 'Update Region' : 'Save Region'}</button>
            </form>
          )}

          <div style={pageStyles.cardGrid}>
            {filteredRegions.map((region) => (
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
      </div>
    </div> 
  );
};

export default AdminRegions;
