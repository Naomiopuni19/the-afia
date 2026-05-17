import React, { useState } from 'react';
import { PlusCircle, Trash2, Image as ImageIcon, Save } from 'lucide-react';

const AdminMenuManager = ({ onAddItem, existingItems, onDeleteItem }) => {
  const [newItem, setNewItem] = useState({
    title: '',
    price: '',
    category: 'Lunch',
    url: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.title || !newItem.price || !newItem.url) return alert("Please fill all fields");
    
    // In a real app, this is where you'd do: axios.post('/api/menu', newItem)
    onAddItem({ ...newItem, id: Date.now() });
    
    // Reset form
    setNewItem({ title: '', price: '', category: 'Lunch', url: '' });
  };

  return (
    <div style={{ padding: '40px', background: '#0f172a', borderRadius: '24px', color: 'white' }}>
      <h2 style={{ fontSize: '32px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <PlusCircle color="#3b82f6" /> Add Menu Item
      </h2>

      {/* FORM SECTION */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Dish/Room Title</label>
          <input 
            value={newItem.title}
            onChange={(e) => setNewItem({...newItem, title: e.target.value})}
            placeholder="e.g. Lobster Thermidor"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Price (USD or GHS)</label>
          <input 
            value={newItem.price}
            onChange={(e) => setNewItem({...newItem, price: e.target.value})}
            placeholder="e.g. $45"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Category</label>
          <select 
            value={newItem.category}
            onChange={(e) => setNewItem({...newItem, category: e.target.value})}
            style={inputStyle}
          >
            <option>Breakfast</option>
            <option>Lunch</option>
            <option>Dinner</option>
            <option>Drinks</option>
            <option>VIP Rooms</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Image URL</label>
          <input 
            value={newItem.url}
            onChange={(e) => setNewItem({...newItem, url: e.target.value})}
            placeholder="Paste Unsplash link here"
            style={inputStyle}
          />
        </div>

        <button type="submit" style={buttonStyle}>
          <Save size={18} /> Upload to Live Site
        </button>
      </form>

      <hr style={{ margin: '40px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* PREVIEW/DELETE SECTION */}
      <h3>Live Inventory Management</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
        {existingItems.map((item) => (
          <div key={item.id} style={cardStyle}>
            <img src={item.url} alt={item.title} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '12px' }} />
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              <strong>{item.title}</strong>
              <div style={{ color: '#3b82f6' }}>{item.price}</div>
            </div>
            <button 
              onClick={() => onDeleteItem(item.id)}
              style={{ background: '#ef4444', border: 'none', color: 'white', padding: '5px', borderRadius: '5px', marginTop: '8px', cursor: 'pointer' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Styles
const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  background: '#1e293b',
  border: '1px solid #334155',
  color: 'white'
};

const buttonStyle = {
  gridColumn: 'span 2',
  padding: '15px',
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px'
};

const cardStyle = {
  background: '#1e293b',
  padding: '10px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.05)'
};

export default AdminMenuManager;