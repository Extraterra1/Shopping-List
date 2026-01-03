import { useState, useEffect } from 'react';
import { subscribeToGroceries, toggleGroceryItem, removeGroceryItem } from '../services/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaTrash } from 'react-icons/fa';

const ProductList = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToGroceries((data) => {
      setItems(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = (item) => {
    // Optimistic update could go here, but waiting for Firestore is usually fast enough
    toggleGroceryItem(item.id, item.checked);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if(confirm('Remove this item?')) {
        removeGroceryItem(id);
    }
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
                    cursor: 'pointer',
                    opacity: item.checked ? 0.6 : 1,
                    backgroundColor: item.checked ? 'var(--bg-color)' : 'var(--surface-color)',
                    transition: 'all 0.2s ease',
                    border: item.checked ? '1px solid transparent' : '1px solid transparent'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                        width: '24px', 
                        height: '24px', 
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
                        fontSize: '1.1rem', 
                        textDecoration: item.checked ? 'line-through' : 'none',
                        color: item.checked ? 'var(--text-secondary)' : 'var(--text-primary)'
                    }}>
                        {item.emoji} {item.name}
                    </span>
                </div>
                
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
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
};

export default ProductList;
