import { useState, useEffect } from 'react';
import { subscribeToGroceries, toggleGroceryItem, removeGroceryItem, updateGroceryItem, saveCustomEmoji } from '../services/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaTrash, FaPen, FaSave, FaTimes } from 'react-icons/fa';
import Input from './ui/Input';

const ProductList = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', emoji: '' });

  useEffect(() => {
    const unsubscribe = subscribeToGroceries((data) => {
      setItems(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = (item) => {
    if (editingId === item.id) return; // Don't toggle if editing
    toggleGroceryItem(item.id, item.checked);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if(confirm('Remove this item?')) {
        removeGroceryItem(id);
    }
  };

  const startEdit = (e, item) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditForm({ name: item.name, emoji: item.emoji });
  };

  const cancelEdit = (e) => {
    if(e) e.stopPropagation();
    setEditingId(null);
  };

  const saveEdit = async (e, item) => {
    e.stopPropagation();
    // 1. Update the item itself
    await updateGroceryItem(item.id, {
        name: editForm.name,
        emoji: editForm.emoji
    });

    // 2. "Learn" the emoji preference if it changed
    if (editForm.emoji !== item.emoji) {
        await saveCustomEmoji(editForm.name, editForm.emoji);
    }

    setEditingId(null);
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Your list is empty. Add something!</p>
      </div>
    );
  }

  // Sort: Unchecked first, then Checked
  const sortedItems = [...items].sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1));

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      <AnimatePresence>
        {sortedItems.map((item) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            layout
            transition={{ duration: 0.2 }}
            style={{ 
                marginBottom: 'var(--spacing-sm)',
            }}
          >
            <div 
                className="card"
                onClick={() => handleToggle(item)}
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: editingId === item.id ? 'default' : 'pointer',
                    opacity: item.checked && editingId !== item.id ? 0.6 : 1,
                    backgroundColor: item.checked ? 'var(--bg-color)' : 'var(--surface-color)',
                    transition: 'all 0.2s ease',
                    border: '1px solid transparent',
                    padding: 'var(--spacing-lg)'
                }}
            >
                {editingId === item.id ? (
                    <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input 
                            value={editForm.emoji}
                            onChange={(e) => setEditForm({...editForm, emoji: e.target.value})}
                            onFocus={() => setEditForm(prev => ({...prev, emoji: ''}))}
                            style={{ 
                              width: '44px', 
                              fontSize: '1.5rem', 
                              padding: '8px', 
                              borderRadius: 'var(--radius-md)', 
                              border: 'none',
                              backgroundColor: 'rgba(0,0,0,0.03)',
                              textAlign: 'center'
                            }}
                        />
                        <input 
                             value={editForm.name}
                             onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                             style={{ 
                               flex: 1, 
                               fontSize: '16px', 
                               padding: '10px', 
                               borderRadius: 'var(--radius-md)', 
                               border: 'none', 
                               backgroundColor: 'rgba(54, 54, 54, 0.59)',
                               color: 'var(--text-primary)',
                               fontWeight: '500'
                             }}
                             autoFocus
                        />
                         <button 
                            onClick={(e) => saveEdit(e, item)} 
                            style={{ 
                                color: 'var(--success-color)', 
                                padding: '10px', 
                                backgroundColor: 'rgba(52, 199, 89, 0.1)', 
                                borderRadius: 'var(--radius-md)' 
                            }}
                         >
                            <FaSave size={18}/>
                         </button>
                         <button 
                            onClick={cancelEdit} 
                            style={{ 
                                color: 'var(--text-secondary)', 
                                padding: '10px',
                                backgroundColor: 'rgba(206, 66, 41, 0.44)', 
                                borderRadius: 'var(--radius-md)' 
                            }}
                         >
                            <FaTimes size={18}/>
                         </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                                width: '28px', 
                                height: '28px', 
                                borderRadius: '50%', 
                                border: item.checked ? 'none' : '2px solid var(--text-secondary)',
                                backgroundColor: item.checked ? 'var(--success-color)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                transition: 'all 0.2s ease'
                            }}>
                                {item.checked && <FaCheck />}
                            </div>
                            <span style={{ 
                                fontSize: '1.25rem', 
                                textDecoration: item.checked ? 'line-through' : 'none',
                                color: item.checked ? 'var(--text-secondary)' : 'var(--text-primary)'
                            }}>
                                {item.emoji} {item.name}
                            </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                                onClick={(e) => startEdit(e, item)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--accent-color)',
                                    padding: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                <FaPen />
                            </button>
                            {item.checked && (
                            <button 
                                    onClick={(e) => handleDelete(e, item.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        padding: '8px',
                                        cursor: 'pointer'
                                    }}
                            >
                                <FaTrash />
                            </button>
                            )}
                        </div>
                    </>
                )}
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
};

export default ProductList;
