import React, { useState } from 'react';

const Rooms = () => {
  // In a full build, this would fetch from your database
  const [rooms, setRooms] = useState([
    { id: '101', type: 'Executive Terrace', price: 250, status: 'Available' },
    { id: '102', type: 'Standard Suite', price: 150, status: 'Occupied' },
    { id: '103', type: 'Standard Suite', price: 150, status: 'Cleaning' },
    { id: '201', type: 'Presidential Penthouse', price: 500, status: 'Available' },
  ]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Occupied': return { color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)' };
      case 'Cleaning': return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' };
      default: return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    }
  };

  const styles = {
    page: { background: '#020617', minHeight: '100vh', display: 'flex', color: 'white', fontFamily: "'Inter', sans-serif" },
    sidebar: { width: '260px', background: '#0f172a', borderRight: '1px solid #1e293b', padding: '40px 20px' },
    main: { flex: 1, padding: '40px 60px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
    card: { 
      background: 'rgba(30, 41, 59, 0.4)', 
      borderRadius: '24px', 
      padding: '30px', 
      border: '1px solid rgba(255,255,255,0.05)',
      transition: '0.3s ease'
    },
    navItem: { color: '#64748b', fontSize: '14px', fontWeight: '600', marginBottom: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }
  };

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <h1 style={{fontSize: '22px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '50px'}}>STAYPILOT</h1>
        <div style={styles.navItem} onClick={() => window.location.href='/dashboard'}><span>📊</span> Dashboard</div>
        <div style={{...styles.navItem, color: 'white'}}><span>🏨</span> Rooms</div>
        <div style={styles.navItem} onClick={() => window.location.href='/book'}><span>✨</span> Public Site</div>
      </div>

      <div style={styles.main}>
        <header style={{marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h2 style={{fontSize: '32px', fontWeight: '800', margin: 0}}>Room Inventory</h2>
            <p style={{color: '#64748b', margin: '5px 0 0 0'}}>Manage your keys and housekeeping status.</p>
          </div>
        </header>

        <div style={styles.grid}>
          {rooms.map(room => {
            const theme = getStatusStyle(room.status);
            return (
              <div key={room.id} style={styles.card}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                  <span style={{fontSize: '24px', fontWeight: '800'}}>#{room.id}</span>
                  <span style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                    color: theme.color, background: theme.bg, border: `1px solid ${theme.color}33`
                  }}>
                    {room.status.toUpperCase()}
                  </span>
                </div>
                <p style={{color: '#94a3b8', margin: '0 0 5px 0'}}>{room.type}</p>
                <h3 style={{margin: '0 0 25px 0'}}>${room.price}<span style={{fontSize: '14px', color: '#475569'}}>/night</span></h3>
                
                <button 
                  onClick={() => {
                    const next = room.status === 'Available' ? 'Cleaning' : 'Available';
                    setRooms(rooms.map(r => r.id === room.id ? {...r, status: next} : r));
                  }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #1e293b',
                    background: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {room.status === 'Cleaning' ? 'Mark Ready' : 'Maintenance'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Rooms;
  