import { useState } from 'react';
import { addGroceryItem } from '../services/firestore';
import Input from './ui/Input';
import Button from './ui/Button';
import { FaPlus } from 'react-icons/fa';

const AddItem = () => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    try {
      await addGroceryItem(value.trim());
      setValue('');
    } catch (error) {
      console.error('Failed to add item', error);
      alert('Error adding item. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add item (e.g., Milk)" />
        <div style={{ width: '60px' }}>
          <Button type="submit" variant="primary" icon={FaPlus} disabled={loading || !value.trim()} style={{ height: '100%', padding: '0' }}></Button>
        </div>
      </div>
    </form>
  );
};

export default AddItem;
