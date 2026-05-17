import React, { useState } from 'react';
import { Bell, Utensils, Bath, Coffee, X, Send, Wind, Wifi, ShoppingBag, Phone, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';

const animations = `
  @keyframes fabPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5), 0 10px 30px rgba(59,130,246,0.35); }
    50%      { box-shadow: 0 0 0 10px rgba(59,130,246,0), 0 10px 30px rgba(59,130,246,0.35); }
  }
  @keyframes panelIn {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes itemIn {
    from { opacity: 0; transform: translateX(10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes successPop {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    from { background-position: -200% center; }
    to   { background-position: 200% center; }
  }
`;

const SERVICES = [
  { id: 'towels',    label: 'Fresh Towels',  icon: Bath,        color: '#3b82f6', desc: 'Fluffy towels delivered' },
  { id: 'food',      label: 'Room Service',  icon: Utensils,    color: '#f59e0b', desc: 'Order food & drinks' },
  { id: 'coffee',    label: 'Coffee / Tea',  icon: Coffee,      color: '#10b981', desc: 'Hot beverages on the way'},
  { id: 'ac',        label: 'AC / Heating',  icon: Wind,        color: '#22d3ee', desc: 'Climate adjustment' },
  { id: 'wifi',      label: 'Wi-Fi Help',    icon: Wifi,        color: '#a78bfa', desc: 'Network support' },
  { id: 'amenities', label: 'Amenities',     icon: ShoppingBag, color: '#f97316', desc: 'Toiletries & extras' },
  { id: 'wakeup',    label: 'Wake-Up Call',  icon: Phone,       color: '#ec4899', desc: 'Set your alarm' },
  { id: 'turndown',  label: 'Turndown',      icon: Sparkles,    color: '#fbbf24', desc: 'Evening room prep' },
];

const GuestServiceRequest = ({ roomNumber = "101", guestName = "Guest", desiredTime = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  const handleRequest = async (service) => {
    setSelected(service);
    setStatus('sending');

    const { error } = await supabase
      .from('service_requests')
      .insert([{
        room_number: roomNumber,
        guest_name: guestName,
        desired_time: desiredTime,
        item_name: service.label,
        request_type: service.label,
        notes: note || null,
        status: 'pending',
      }])
      .select();

    if (error) {
      console.error('Error sending request:', error);
      setStatus('idle');
      setSelected(null);
      return;
    }

    setStatus('success');
    setTimeout(() => {
      setStatus('idle');
      setSelected(null);
      setNote('');
      setShowNote(false);
      setIsOpen(false);
    }, 2800);
  };

  const IconComp = selected ? selected.icon : null;

  return (
    <>
      <style>{animations}</style>

      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white', border: 'none',
              padding: '16px 26px', borderRadius: '50px',
              display: 'flex', alignItems: 'center', gap: '10px',
              fontWeight: '800', fontSize: '14px', cursor: 'pointer',
              animation: 'fabPulse 2.5s ease-in-out infinite',
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              letterSpacing: '0.3px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Bell size={18} />
            Need Something?
          </button>
        )}

        {isOpen && (
          <div style={{
            width: '340px',
            background: 'rgba(10, 18, 38, 0.97)',
            borderRadius: '28px',
            border: '1px solid rgba(59,130,246,0.2)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
            backdropFilter: 'blur(30px)',
            overflow: 'hidden',
            animation: 'panelIn 0.35s cubic-bezier(0.19,1,0.22,1)',
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          }}>
            <div style={{
              padding: '22px 24px 18px',
              borderBottom: '1px solid rgba(51,65,85,0.4)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '10px', color: '#3b82f6', fontWeight: '800', letterSpacing: '2px' }}>
                  STAYPILOT · SUITE {roomNumber}
                </p>
                <h3 style={{ margin: '3px 0 0', fontSize: '18px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
                  How can we help?
                </h3>
              </div>
              <button
                onClick={() => { setIsOpen(false); setStatus('idle'); setSelected(null); setNote(''); setShowNote(false); }}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(51,65,85,0.4)',
                  borderRadius: '10px', padding: '7px 10px', cursor: 'pointer', color: '#64748b',
                  display: 'flex', alignItems: 'center', transition: '0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
              >
                <X size={15} />
              </button>
            </div>

            {status === 'success' && (
              <div style={{ padding: '50px 24px', textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px',
                  animation: 'successPop 0.5s cubic-bezier(0.19,1,0.22,1)',
                  boxShadow: '0 10px 30px rgba(16,185,129,0.35)',
                }}>✓</div>

                {IconComp && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: selected ? `${selected.color}15` : 'transparent',
                    border: `1px solid ${selected ? selected.color + '40' : 'transparent'}`,
                    color: selected?.color, borderRadius: '50px',
                    padding: '6px 16px', fontSize: '13px', fontWeight: '800',
                    marginBottom: '14px',
                  }}>
                    <IconComp size={14} />
                    {selected?.label}
                  </div>
                )}

                <p style={{ color: 'white', fontWeight: '800', fontSize: '16px', margin: '0 0 6px' }}>
                  Request sent successfully
                </p>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                  {guestName} from Suite {roomNumber} submitted this request{desiredTime ? ` for ${desiredTime}` : ''}.
                </p>
              </div>
            )}

            {status === 'sending' && (
              <div style={{ padding: '50px 24px', textAlign: 'center' }}>
                <div style={{
                  width: '48px', height: '48px', border: '3px solid rgba(59,130,246,0.2)',
                  borderTop: '3px solid #3b82f6', borderRadius: '50%',
                  margin: '0 auto 20px', animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '700', margin: 0 }}>
                  Sending your request…
                </p>
              </div>
            )}

            {status === 'idle' && (
              <div style={{ padding: '18px 20px 22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {SERVICES.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleRequest(s)}
                        style={{
                          background: `${s.color}0d`,
                          border: `1px solid ${s.color}25`,
                          borderRadius: '18px', padding: '16px 14px',
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.2s ease',
                          animation: `itemIn 0.3s ease ${i * 0.04}s both`,
                          display: 'flex', flexDirection: 'column', gap: '10px',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = `${s.color}20`;
                          e.currentTarget.style.border = `1px solid ${s.color}55`;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = `${s.color}0d`;
                          e.currentTarget.style.border = `1px solid ${s.color}25`;
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '12px',
                          background: `${s.color}18`, border: `1px solid ${s.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: s.color,
                        }}>
                          <Icon size={17} />
                        </div>
                        <div>
                          <div style={{ color: 'white', fontSize: '13px', fontWeight: '800', marginBottom: '2px' }}>
                            {s.label}
                          </div>
                          <div style={{ color: '#475569', fontSize: '10px', fontWeight: '600' }}>
                            {s.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowNote(v => !v)}
                  style={{
                    width: '100%', padding: '11px', borderRadius: '14px',
                    background: showNote ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                    border: showNote ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(51,65,85,0.3)',
                    color: showNote ? '#3b82f6' : '#475569',
                    fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                    transition: '0.2s', letterSpacing: '0.3px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <Send size={13} />
                  {showNote ? 'Hide note' : 'Add a note to your request'}
                </button>

                {showNote && (
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g. Extra blanket please, allergic to feathers…"
                    rows={3}
                    style={{
                      marginTop: '10px', width: '100%', padding: '12px 14px',
                      borderRadius: '14px', resize: 'none', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(51,65,85,0.4)',
                      color: 'white', fontSize: '13px', fontWeight: '600', outline: 'none',
                      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      lineHeight: 1.6,
                      transition: 'border 0.2s',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(51,65,85,0.4)'}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default GuestServiceRequest;