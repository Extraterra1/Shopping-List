
import { useState, useEffect, useRef } from 'react';
import { subscribeToGroceries, toggleGroceryItem, removeGroceryItem, updateGroceryItem, saveCustomEmoji, updateGroceryOrder } from '../services/firestore';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { FaCheck, FaTrash, FaPen, FaSave, FaTimes } from 'react-icons/fa';
import { MdDragIndicator } from 'react-icons/md';
import Input from './ui/Input';

const ProductList = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', emoji: '' });

  useEffect(() => {
    const unsubscribe = subscribeToGroceries((data) => {
        // If we are currently dragging (or just reordered locally), we might have a conflict.
        // But for simplicity, we'll accept server updates. 
        // Real-time dnd with subscriptions can be tricky, but this is a simple personal app.
        setItems(data);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = (item) => {
    if (editingId === item.id) return; 
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

  const handleReorder = (newOrder) => {
      // mix new active order with existing completed items
      const completed = items.filter(i => i.checked);
      const combined = [...newOrder, ...completed];
      
      setItems(combined); // Optimistic update
      
      // Debounce or just save immediately? 
      // For immediate feel, let's just save. Batch writing is cheap enough for this scale.
      updateGroceryOrder(combined);
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

  const activeItems = items.filter(i => !i.checked);
  const completedItems = items.filter(i => i.checked);

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Active Items (Reorderable) */}
      <Reorder.Group axis="y" values={activeItems} onReorder={handleReorder} style={{ listStyle: 'none', padding: 0 }}>
        <AnimatePresence>
            {activeItems.map((item) => (
            <Item 
                key={item.id} 
                item={item} 
                editingId={editingId}
                editForm={editForm}
                setEditForm={setEditForm}
                handleToggle={handleToggle}
                handleDelete={handleDelete}
                startEdit={startEdit}
                cancelEdit={cancelEdit}
                saveEdit={saveEdit}
            />
            ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Completed Items (Static) */}
      {completedItems.length > 0 && (
          <>
            <h3 style={{ margin: '20px 0 10px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Completed</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {completedItems.map((item) => (
                    <Item 
                        key={item.id} 
                        item={item} 
                        editingId={false} // Disable editing for completed items for simplicity, or keep it true
                        editForm={editForm}
                        setEditForm={setEditForm}
                        handleToggle={handleToggle}
                        handleDelete={handleDelete}
                        startEdit={startEdit}
                        cancelEdit={cancelEdit}
                        saveEdit={saveEdit}
                        isCompleted={true}
                    />
                ))}
            </ul>
          </>
      )}
    </div>
  );
};

// Extracted Item component for cleanliness
const Item = ({ item, editingId, editForm, setEditForm, handleToggle, handleDelete, startEdit, cancelEdit, saveEdit, isCompleted }) => {
    const isEditing = editingId === item.id;
    
    const content = (
        <div 
            className="card"
            onClick={() => !isEditing && handleToggle(item)}
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: isEditing ? 'default' : 'pointer',
                opacity: isCompleted && !isEditing ? 0.6 : 1,
                backgroundColor: item.checked ? 'var(--bg-color)' : 'var(--surface-color)',
                transition: 'all 0.2s ease',
                border: '1px solid transparent',
                padding: 'var(--spacing-lg)'
            }}
        >
             {isEditing ? (
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
                               backgroundColor: 'rgba(0,0,0,0.03)',
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
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                borderRadius: 'var(--radius-md)' 
                            }}
                         >
                            <FaTimes size={18}/>
                         </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            {/* Drag Handle (Only for active items) */}
                            {!isCompleted && (
                                <div style={{ color: 'var(--text-secondary)', cursor: 'grab', display: 'flex', alignItems: 'center' }} onPointerDown={(e) => e.stopPropagation()}>
                                    <MdDragIndicator size={20} style={{ opacity: 0.3 }} />
                                </div>
                            )}

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
                                transition: 'all 0.2s ease',
                                flexShrink: 0
                            }}>
                                {item.checked && <FaCheck />}
                            </div>
                            <span style={{ 
                                fontSize: '1.25rem', 
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontWeight: '500'
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
    );

    if (isCompleted) {
        return (
            <motion.li
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ marginBottom: 'var(--spacing-sm)' }}
            >
                {content}
            </motion.li>
        )
    }

    return (
        <Reorder.Item value={item} id={item.id} style={{ marginBottom: 'var(--spacing-sm)' }}>
             {content}
        </Reorder.Item>
    );
};

export default ProductList;

