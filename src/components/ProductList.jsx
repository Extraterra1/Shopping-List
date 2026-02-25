import { useState, useEffect } from 'react';
import { subscribeToGroceries, toggleGroceryItem, removeGroceryItem, updateGroceryItem, saveCustomEmoji, updateGroceryOrder } from '../services/firestore';
import styled from 'styled-components';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { FaCheck, FaTrash, FaPen, FaSave, FaTimes, FaBars } from 'react-icons/fa';

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
    removeGroceryItem(id);
  };

  const startEdit = (e, item) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditForm({ name: item.name, emoji: item.emoji });
  };

  const cancelEdit = (e) => {
    if (e) e.stopPropagation();
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
    const completed = items.filter((i) => i.checked);
    const combined = [...newOrder, ...completed];

    setItems(combined); // Optimistic update

    // Debounce or just save immediately?
    // For immediate feel, let's just save. Batch writing is cheap enough for this scale.
    updateGroceryOrder(combined);
  };

  if (isLoading) {
    return <LoadingContainer data-testid="list-loading">Loading...</LoadingContainer>;
  }

  if (items.length === 0) {
    return (
      <EmptyCard className="card" data-testid="list-empty">
        <EmptyText>Your list is empty. Add something!</EmptyText>
      </EmptyCard>
    );
  }

  const activeItems = items.filter((i) => !i.checked);
  const completedItems = items.filter((i) => i.checked);

  return (
    <ListWrapper data-testid="product-list">
      {/* Active Items (Reorderable) */}
      <StyledReorderGroup axis="y" values={activeItems} onReorder={handleReorder} data-testid="active-list">
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
      </StyledReorderGroup>

      {/* Completed Items (Static) */}
      {completedItems.length > 0 && (
        <>
          <SectionHeader data-testid="completed-section">Completed</SectionHeader>
          <CompletedList data-testid="completed-list">
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
          </CompletedList>
        </>
      )}
    </ListWrapper>
  );
};

// Extracted Item component for cleanliness
const Item = ({ item, editingId, editForm, setEditForm, handleToggle, handleDelete, startEdit, cancelEdit, saveEdit, isCompleted }) => {
  const isEditing = editingId === item.id;
  const controls = useDragControls();
  const safeName = item.name?.toLowerCase().replace(/\s+/g, '-');
  const displayName = item.name
    ?.trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  const content = (
    <StyledCard
      className="card"
      $isEditing={isEditing}
      $isCompleted={isCompleted}
      $checked={item.checked}
      data-testid={`item-card-${item.id}`}
      aria-label={`Grocery item ${item.name}`}
    >
      {isEditing ? (
        <EditFormContainer onClick={(e) => e.stopPropagation()} data-testid={`item-edit-form-${item.id}`}>
          <EmojiInput
            value={editForm.emoji}
            onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
            onFocus={() => setEditForm((prev) => ({ ...prev, emoji: '' }))}
            data-testid={`edit-emoji-input-${safeName}`}
            aria-label={`Edit emoji for ${item.name}`}
          />
          <NameInput
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            autoFocus
            data-testid={`edit-name-input-${safeName}`}
            aria-label={`Edit name for ${item.name}`}
          />
          <ActionButton onClick={(e) => saveEdit(e, item)} $variant="save" aria-label={`Save ${item.name}`} data-testid={`save-edit-${safeName}`}>
            <FaSave size={20} />
          </ActionButton>
          <ActionButton onClick={cancelEdit} $variant="cancel" aria-label={`Cancel editing ${item.name}`} data-testid={`cancel-edit-${safeName}`}>
            <FaTimes size={20} />
          </ActionButton>
        </EditFormContainer>
      ) : (
        <>
          <ItemContentContainer>
            {/* Drag Handle (Only for active items) */}
            <DragHandle
              onPointerDown={(e) => controls.start(e)}
              role="button"
              tabIndex={0}
              aria-label={`Reorder ${item.name}`}
              data-testid={`drag-handle-${safeName}`}
            >
              <FaBars />
            </DragHandle>
            <Checkbox
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(item);
              }}
              aria-label={`Toggle ${item.name}`}
              $checked={item.checked}
              data-testid={`item-check-${safeName}`}
            >
              {item.checked && <FaCheck />}
            </Checkbox>
            <ItemText $isCompleted={isCompleted} data-testid={`item-text-${safeName}`}>
              {item.emoji} {displayName}
            </ItemText>
          </ItemContentContainer>

          <ActionsContainer>
            <IconButton
              onClick={(e) => startEdit(e, item)}
              $variant="edit"
              aria-label={`Edit ${item.name}`}
              data-testid={`edit-item-${safeName}`}
            >
              <FaPen size={20} />
            </IconButton>
            {item.checked && (
              <IconButton
                onClick={(e) => handleDelete(e, item.id)}
                $variant="delete"
                aria-label={`Delete ${item.name}`}
                data-testid={`delete-item-${safeName}`}
              >
                <FaTrash size={20} />
              </IconButton>
            )}
          </ActionsContainer>
        </>
      )}
    </StyledCard>
  );

  if (isCompleted) {
    return (
      <StyledMotionLi layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid={`completed-row-${item.id}`}>
        {content}
      </StyledMotionLi>
    );
  }

  return (
    <StyledReorderItem value={item} id={item.id} dragListener={false} dragControls={controls} data-testid={`active-row-${item.id}`}>
      {content}
    </StyledReorderItem>
  );
};

// Styled Components
const LoadingContainer = styled.div`
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
`;

const EmptyCard = styled.div`
  text-align: center;
`;

const EmptyText = styled.p`
  color: var(--text-secondary);
`;

const ListWrapper = styled.div`
  padding-bottom: 40px;
`;

const StyledReorderGroup = styled(Reorder.Group)`
  list-style: none;
  padding: 0;
`;

const SectionHeader = styled.h3`
  margin: 20px 0 10px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const CompletedList = styled.ul`
  list-style: none;
  padding: 0;
`;

const StyledCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: default;
  opacity: ${(props) => (props.$isCompleted && !props.$isEditing ? 0.6 : 1)};
  background-color: ${(props) => (props.$checked ? 'var(--bg-color)' : 'var(--surface-color)')};
  transition: all 0.2s ease;
  border: 1px solid transparent;
  padding: var(--spacing-lg);
`;

const EditFormContainer = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  align-items: center;
`;

const EmojiInput = styled.input`
  width: 44px;
  font-size: 1.5rem;
  padding: 8px;
  border-radius: var(--radius-md);
  border: none;
  background-color: rgba(0, 0, 0, 0.03);
  text-align: center;
`;

const NameInput = styled.input`
  flex: 1;
  font-size: 16px;
  padding: 10px;
  border-radius: var(--radius-md);
  border: none;
  background-color: rgba(0, 0, 0, 0.03);
  color: var(--text-primary);
  font-weight: 500;
`;

const ActionButton = styled.button`
  color: ${(props) => (props.$variant === 'save' ? 'var(--success-color)' : 'var(--text-secondary)')};
  padding: 10px;
  background-color: ${(props) => (props.$variant === 'save' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0,0,0,0.05)')};
  border-radius: var(--radius-md);
`;

const ItemContentContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const Checkbox = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: ${(props) => (props.$checked ? 'none' : '2px solid var(--text-secondary)')};
  background-color: ${(props) => (props.$checked ? 'var(--success-color)' : 'transparent')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
`;

const ItemText = styled.span`
  font-size: 1.25rem;
  text-decoration: ${(props) => (props.$isCompleted ? 'line-through' : 'none')};
  color: ${(props) => (props.$isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)')};
  font-weight: 500;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => (props.$variant === 'edit' ? 'var(--accent-color)' : 'var(--text-secondary)')};
  padding: 8px;
  cursor: pointer;
`;

const StyledMotionLi = styled(motion.li)`
  margin-bottom: var(--spacing-sm);
`;

const DragHandle = styled.div`
  cursor: grab;
  padding: 10px 5px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none; /* Critical for dragging on touch devices */
  opacity: 0.5;
  transition: opacity 0.2s;

  &:active {
    cursor: grabbing;
    opacity: 1;
  }

  @media (hover: hover) {
    &:hover {
      opacity: 0.8;
    }
  }
`;

const StyledReorderItem = styled(Reorder.Item)`
  margin-bottom: var(--spacing-sm);
  touch-action: pan-y; /* Allow scrolling on the card body */
`;

export default ProductList;
