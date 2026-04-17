import { useState, useEffect } from 'react';
import {
  clearCompletedGroceryItems,
  persistReorderAndLearn,
  removeGroceryItem,
  saveCustomEmoji,
  subscribeToGroceries,
  toggleGroceryItem,
  updateGroceryItem
} from '../services/firestore';
import styled from 'styled-components';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { FaCheck, FaTrash, FaPen, FaSave, FaTimes, FaBars } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useLanguage } from "../context/LanguageContext";

const CLEAR_COMPLETED_CONFIRMATION_MS = 2500;

const ProductList = ({ uid }) => {
  const { t } = useLanguage();
  const [items, setItems] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', emoji: '' });
  const [isClearCompletedArmed, setIsClearCompletedArmed] = useState(false);
  const [isClearingCompleted, setIsClearingCompleted] = useState(false);

  const activeItems = items?.filter((i) => !i.checked) ?? [];
  const completedItems = items?.filter((i) => i.checked) ?? [];

  useEffect(() => {
    if (!uid) {
      return undefined;
    }

    const unsubscribe = subscribeToGroceries(uid, (data) => {
      setItems(data);
    });
    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!isClearCompletedArmed) {
      return undefined;
    }

    if (completedItems.length === 0) {
      setIsClearCompletedArmed(false);
      return undefined;
    }

    const resetTimer = window.setTimeout(() => {
      setIsClearCompletedArmed(false);
    }, CLEAR_COMPLETED_CONFIRMATION_MS);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [completedItems.length, isClearCompletedArmed]);

  const handleToggle = (item) => {
    if (editingId === item.id) return;
    toggleGroceryItem(uid, item.id, item.checked);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    removeGroceryItem(uid, id);
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
    await updateGroceryItem(uid, item.id, {
      name: editForm.name,
      emoji: editForm.emoji
    });

    // 2. "Learn" the emoji preference if it changed
    if (editForm.emoji !== item.emoji) {
      await saveCustomEmoji(uid, editForm.name, editForm.emoji);
    }

    setEditingId(null);
  };

  const handleReorder = (newOrder) => {
    if (!items) {
      return;
    }

    // mix new active order with existing completed items
    const completed = items.filter((i) => i.checked);
    const combined = [...newOrder, ...completed];

    setItems(combined); // Optimistic update

    persistReorderAndLearn(uid, newOrder, combined).catch((error) => {
      console.error("Failed to persist reorder changes", error);
    });
  };

  const handleClearCompleted = async () => {
    if (completedItems.length === 0 || isClearingCompleted) {
      return;
    }

    if (!isClearCompletedArmed) {
      setIsClearCompletedArmed(true);
      return;
    }

    setIsClearingCompleted(true);

    try {
      await clearCompletedGroceryItems(uid);
      setIsClearCompletedArmed(false);
    } catch (error) {
      console.error("Failed to clear completed grocery items", error);
    } finally {
      setIsClearingCompleted(false);
    }
  };

  if (!uid || items === null) {
    return <LoadingContainer data-testid="list-loading">{t("productList.loading")}</LoadingContainer>;
  }

  if (items.length === 0) {
    return (
      <EmptyCard className="card" data-testid="list-empty">
        <EmptyText>{t("productList.empty")}</EmptyText>
      </EmptyCard>
    );
  }

  const clearCompletedLabel = isClearCompletedArmed
    ? t("productList.confirmClearAll")
    : t("productList.clearAll");
  const clearCompletedAriaLabel = isClearCompletedArmed
    ? t("productList.aria.confirmClearCompleted")
    : t("productList.aria.clearCompleted");

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
              t={t}
            />
          ))}
        </AnimatePresence>
      </StyledReorderGroup>

      {/* Completed Items (Static) */}
      {completedItems.length > 0 && (
        <>
          <CompletedHeaderRow>
            <SectionHeader data-testid="completed-section">{t("productList.completed")}</SectionHeader>
            <ClearCompletedButton
              type="button"
              layout
              initial={false}
              animate={isClearCompletedArmed ? "armed" : "idle"}
              whileTap={{ scale: 0.98 }}
              variants={clearCompletedButtonVariants}
              transition={clearCompletedButtonTransition}
              onClick={handleClearCompleted}
              aria-label={clearCompletedAriaLabel}
              data-testid="clear-completed-button"
              $isArmed={isClearCompletedArmed}
              disabled={isClearingCompleted}
            >
              <ClearCompletedIcon
                animate={isClearCompletedArmed ? "armed" : "idle"}
                variants={clearCompletedIconVariants}
                transition={clearCompletedButtonTransition}
              >
                <FaTrash size={12} />
              </ClearCompletedIcon>
              <AnimatePresence mode="wait" initial={false}>
                <ClearCompletedLabel
                  key={clearCompletedLabel}
                  initial={{ opacity: 0, x: -10, scale: 0.92, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: 10, scale: 0.94, filter: 'blur(4px)' }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {clearCompletedLabel}
                </ClearCompletedLabel>
              </AnimatePresence>
            </ClearCompletedButton>
          </CompletedHeaderRow>
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
                t={t}
              />
            ))}
          </CompletedList>
        </>
      )}
    </ListWrapper>
  );
};

// Extracted Item component for cleanliness
const Item = ({ item, editingId, editForm, setEditForm, handleToggle, handleDelete, startEdit, cancelEdit, saveEdit, isCompleted, t }) => {
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
      aria-label={t("productList.aria.groceryItem", { name: item.name })}
    >
      {isEditing ? (
        <EditFormContainer onClick={(e) => e.stopPropagation()} data-testid={`item-edit-form-${item.id}`}>
          <EmojiInput
            value={editForm.emoji}
            onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
            onFocus={() => setEditForm((prev) => ({ ...prev, emoji: '' }))}
            data-testid={`edit-emoji-input-${safeName}`}
            aria-label={t("productList.aria.editEmoji", { name: item.name })}
          />
          <NameInput
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            autoFocus
            data-testid={`edit-name-input-${safeName}`}
            aria-label={t("productList.aria.editName", { name: item.name })}
          />
          <ActionButton onClick={(e) => saveEdit(e, item)} $variant="save" aria-label={t("productList.aria.save", { name: item.name })} data-testid={`save-edit-${safeName}`}>
            <FaSave size={20} />
          </ActionButton>
          <ActionButton onClick={cancelEdit} $variant="cancel" aria-label={t("productList.aria.cancelEditing", { name: item.name })} data-testid={`cancel-edit-${safeName}`}>
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
              aria-label={t("productList.aria.reorder", { name: item.name })}
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
              aria-label={t("productList.aria.toggle", { name: item.name })}
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
              aria-label={t("productList.aria.edit", { name: item.name })}
              data-testid={`edit-item-${safeName}`}
            >
              <FaPen size={20} />
            </IconButton>
            {item.checked && (
              <IconButton
                onClick={(e) => handleDelete(e, item.id)}
                $variant="delete"
                aria-label={t("productList.aria.delete", { name: item.name })}
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
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const CompletedHeaderRow = styled.div`
  margin: 20px 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
`;

const ClearCompletedButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  min-width: 104px;
  padding: 0 12px;
  border: 1px solid ${(props) => (props.$isArmed ? 'rgba(255, 59, 48, 0.28)' : 'rgba(255, 59, 48, 0.14)')};
  border-radius: 999px;
  background: ${(props) => (props.$isArmed ? 'rgba(255, 59, 48, 0.16)' : 'rgba(255, 59, 48, 0.08)')};
  color: var(--danger-color);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: ${(props) => (props.$isArmed ? '0 10px 20px rgba(255, 59, 48, 0.16)' : 'none')};
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`;

const ClearCompletedIcon = styled(motion.span)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ClearCompletedLabel = styled(motion.span)`
  display: inline-flex;
  align-items: center;
`;

const clearCompletedButtonTransition = {
  type: "spring",
  stiffness: 320,
  damping: 24,
  mass: 0.9
};

const clearCompletedButtonVariants = {
  idle: {
    minWidth: 104,
    paddingLeft: 12,
    paddingRight: 12
  },
  armed: {
    minWidth: 126,
    paddingLeft: 14,
    paddingRight: 16
  }
};

const clearCompletedIconVariants = {
  idle: {
    rotate: 0,
    x: 0,
    scale: 1
  },
  armed: {
    rotate: -8,
    x: -1,
    scale: 1.08
  }
};

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

ProductList.propTypes = {
  uid: PropTypes.string.isRequired
};

export default ProductList;
