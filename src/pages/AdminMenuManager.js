import React, { useState } from 'react';
import { PlusCircle, Trash2, Image as ImageIcon, Save, Utensils, Bed } from 'lucide-react';

const AdminMenuManager = () => {
  // State to manage the list of items
  const [items, setItems] = useState([
    { id: 1, title: "English Breakfast", price: "25", category: "Breakfast", url: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=600" }
  ]);

  const [newItem, setNewItem] = useState({
    title: '',
    price: '',
    category: 'Lunch',
    url: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.title || !newItem.price || !newItem.url) return alert("Please fill all fields");
    
    // Add new item to the list
    setItems([...items, { ...newItem, id: Date.now() }]);
    
    // Reset form
    setNewItem({ title: '', price: '', category: 'Lunch', url: '' });
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div style={{ padding: '40px', background: '#020617', minHeight: '100vh', color: 'white' }}>
      <h2 style={{ fontSize: '32px', marginBottom: '30px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <PlusCircle color="#3b82f6" /> Management Dashboard
      </h2>

      {/* UPLOAD FORM */}
      <div style={{ background: '#0f172a', padding: '30px', borderRadius: '24px', border: '1px solid #1e293b', marginBottom: '50px' }}>
        <h3 style={{ marginBottom: '20px' }}>Add New Item (Food or Room)</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={inputGroup}>
            <label style={labelStyle}>Item Title</label>
            <input 
              style={inputStyle}
              value={newItem.title}
              onChange={(e) => setNewItem({...newItem, title: e.target.value})}
              placeholder="e.g. Presidential Suite"
            />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Price</label>
            <input 
              style={inputStyle}
              value={newItem.price}
              onChange={(e) => setNewItem({...newItem, price: e.target.value})}
              placeholder="e.g. 1500"
            />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Category</label>
            <select 
              style={inputStyle}
              value={newItem.category}
              onChange={(e) => setNewItem({...newItem, category: e.target.value})}
            >
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
              <option>VIP Rooms</option>
              <option>Standard Rooms</option>
            </select>
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Image URL</label>
            <input 
              style={inputStyle}
              value={newItem.url}
              onChange={(e) => setNewItem({...newItem, url: e.target.value})}
              placeholder="Paste image link"
            />
          </div>

          <button type="submit" style={buttonStyle}>
            <Save size={18} /> Update Live Catalog
          </button>
        </form>
      </div>

      {/* LIVE PREVIEW SECTION */}
      <h3 style={{ marginBottom: '20px' }}>Current Inventory</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {items.map((item) => (
          <div key={item.id} style={cardStyle}>
            <img src={item.url} alt={item.title} style={imgStyle} />
            <div style={{ padding: '15px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{item.title}</div>
              <div style={{ color: '#3b82f6', margin: '5px 0' }}>${item.price}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{item.category}</div>
              <button 
                onClick={() => deleteItem(item.id)}
                style={deleteBtnStyle}
              >
                <Trash2 size={16} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Internal Styles
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '14px', color: '#94a3b8' };
const inputStyle = { padding: '12px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white' };
const buttonStyle = { gridColumn: '1 / -1', padding: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' };
const cardStyle = { background: '#0f172a', borderRadius: '18px', overflow: 'hidden', border: '1px solid #1e293b' };
const imgStyle = { width: '100%', height: '140px', objectFit: 'cover' };
const deleteBtnStyle = { marginTop: '15px', background: '#ef444415', color: '#ef4444', border: '1px solid #ef4444', padding: '8px', borderRadius: '8px', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };

export default AdminMenuManager;