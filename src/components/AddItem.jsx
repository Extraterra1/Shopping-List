import { useState } from 'react';
import PropTypes from 'prop-types';
import { addGroceryItem } from '../services/firestore';
import { useLanguage } from "../context/LanguageContext";
import Input from './ui/Input';
import Button from './ui/Button';
import { FaPlus } from 'react-icons/fa';

const AddItem = ({ uid }) => {
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    try {
      await addGroceryItem(uid, value.trim());
      setValue('');
    } catch (error) {
      console.error('Failed to add item', error);
      alert(t("addItem.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("addItem.placeholder")}
          aria-label={t("addItem.inputAria")}
          data-testid="add-input"
        />
        <div style={{ width: '60px' }}>
          <Button
            type="submit"
            variant="primary"
            icon={FaPlus}
            disabled={loading || !value.trim()}
            style={{ height: '100%', padding: '0' }}
            aria-label={t("addItem.submitAria")}
            data-testid="add-submit"
          />
        </div>
      </div>
    </form>
  );
};

AddItem.propTypes = {
  uid: PropTypes.string.isRequired
};

export default AddItem;
