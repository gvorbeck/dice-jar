import { useState, useCallback, useMemo } from 'react';
import { useModal } from '@/hooks';
import { useEquipmentManager } from '@/hooks';
import { SectionWrapper } from '@/components/ui/core/layout';
import { Card, Badge, Typography } from '@/components/ui/core/display';
import { Button, Switch, TextInput, TextArea, Select, NumberInput, FormField } from '@/components/ui/core/primitives';
import { Modal } from '@/components/modals';
import { Accordion } from '@/components/ui/core/layout';
import EquipmentSelector from '@/components/domain/equipment/EquipmentSelector';
import { CustomEquipmentModal } from '@/components/modals/LazyModals';
import { Icon } from '@/components/ui/core/display/Icon';
import { SkeletonList } from '@/components/ui/core/feedback';
import { cleanEquipmentArray } from '@/utils';
import type { Character, Equipment as EquipmentItem } from '@/types';
import './Equipment.css';

interface EquipmentProps {
  character?: Character;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  loading?: boolean;
  onEquipmentChange?: (equipment: EquipmentItem[]) => void;
}

interface WeaponPropertiesProps {
  editForm: EquipmentItem;
  updateEditForm: (field: keyof EquipmentItem, value: string | number) => void;
}

function WeaponProperties({ editForm, updateEditForm }: WeaponPropertiesProps) {
  return (
    <div className="form-section">
      <Typography variant="body" weight="medium">
        Weapon Properties
      </Typography>

      <div className="form-grid">
        {editForm.damage && (
          <FormField label="Damage">
            <TextInput value={editForm.damage} onChange={(value) => updateEditForm('damage', value)} />
          </FormField>
        )}

        {editForm.twoHandedDamage && (
          <FormField label="Two-Handed Damage">
            <TextInput value={editForm.twoHandedDamage} onChange={(value) => updateEditForm('twoHandedDamage', value)} />
          </FormField>
        )}
      </div>
    </div>
  );
}

interface ArmorPropertiesProps {
  editForm: EquipmentItem;
  updateEditForm: (field: keyof EquipmentItem, value: string | number) => void;
}

function ArmorProperties({ editForm, updateEditForm }: ArmorPropertiesProps) {
  return (
    <div className="form-section">
      <Typography variant="body" weight="medium">
        Armor Properties
      </Typography>

      <div className="form-grid" data-cols="1">
        {editForm.AC && (
          <FormField label="Armor Class">
            <TextInput value={editForm.AC.toString()} onChange={(value) => updateEditForm('AC', value)} />
          </FormField>
        )}

        {editForm.missileAC && (
          <FormField label="Missile AC">
            <TextInput value={editForm.missileAC} onChange={(value) => updateEditForm('missileAC', value)} />
          </FormField>
        )}
      </div>
    </div>
  );
}

export default function Equipment({
  character,
  className = '',
  size = 'md',
  editable = false,
  loading = false,
  onEquipmentChange,
}: EquipmentProps) {
  const { isOpen: showSelector, toggle: toggleSelector } = useModal();
  const { isOpen: showCustomModal, open: openCustomModal, close: closeCustomModal } = useModal();
  const [editingItem, setEditingItem] = useState<{
    item: EquipmentItem;
    index: number;
  } | null>(null);
  const [editForm, setEditForm] = useState<EquipmentItem | null>(null);

  // Performance optimization: Only show search for larger equipment inventories
  const SEARCH_THRESHOLD = 8; // Show search bar when equipment count exceeds this

  // Use the equipment manager hook
  const {
    addEquipmentToInventory,
    removeEquipmentFromInventory: handleEquipmentRemove,
    updateEquipmentInInventory,
    toggleWearing,
    isWearableItem,
    formatWeight,
    formatCost,
  } = useEquipmentManager(character, onEquipmentChange);

  const handleEquipmentAdd = (newEquipment: EquipmentItem) => {
    // Ensure we're adding at least 1 item (EquipmentSelector sends items with amount: 0)
    const equipmentToAdd = {
      ...newEquipment,
      amount: Math.max(1, newEquipment.amount),
    };
    addEquipmentToInventory(equipmentToAdd);
    // Don't close selector anymore - let user add multiple items
  };

  const handleCustomEquipmentAdd = (newEquipment: EquipmentItem) => {
    addEquipmentToInventory(newEquipment);
    closeCustomModal();
  };

  const handleEquipmentEdit = useCallback(
    (index: number) => {
      if (!character) return;
      const item = character.equipment[index];
      if (!item) return;

      setEditingItem({ item, index });
      setEditForm({ ...item });
    },
    [character],
  );

  const handleEditSave = useCallback(() => {
    if (!editForm || editingItem === null) return;

    updateEquipmentInInventory(editingItem.index, editForm);
    setEditingItem(null);
    setEditForm(null);
  }, [editForm, editingItem, updateEquipmentInInventory]);

  const handleEditCancel = useCallback(() => {
    setEditingItem(null);
    setEditForm(null);
  }, []);

  const updateEditForm = useCallback(
    (field: keyof EquipmentItem, value: string | number) => {
      if (!editForm) return;
      setEditForm({ ...editForm, [field]: value });
    },
    [editForm],
  );

  // Prepare equipment items for the Accordion component (memoized for performance)
  const equipmentForAccordion = useMemo(() => {
    if (!character) return [];
    const cleanedEquipment = cleanEquipmentArray(character.equipment);
    return cleanedEquipment.map((item) => ({
      ...item,
      originalIndex: character.equipment.findIndex((origItem) => origItem === item),
      category: item.category || 'Other',
    }));
  }, [character]);

  // Render function for individual equipment items in the accordion
  const renderEquipmentItem = useCallback(
    (item: EquipmentItem & { originalIndex: number }) => {
      return (
        <div className="equip-item">
          {/* Item Info */}
          <div className="equip-info">
            <div className="equip-name-row">
              <Typography variant="body" color="primary" weight="medium" className="equip-name">
                {item.name}
                {item.wearing && (
                  <Badge variant="success" size="sm" aria-label="Currently equipped">
                    Equipped
                  </Badge>
                )}
              </Typography>
              {item.amount > 1 && (
                <Badge variant="secondary" size="sm">
                  × {item.amount}
                </Badge>
              )}
            </div>

            {/* Item Description */}
            {item.description && (
              <div className="equip-desc">
                <Typography variant="bodySmall" color="muted">
                  {item.description}
                </Typography>
              </div>
            )}

            {/* Item Statistics */}
            <div className="equip-stats">
              <span>
                <Icon name="coin" size="xs" aria-hidden={true} />
                {formatCost(item.costValue, item.costCurrency, item.amount)}
              </span>
              <span>
                <Icon name="weight" size="xs" aria-hidden={true} />
                {formatWeight(item.weight, item.amount)}
              </span>
              {item.damage && (
                <span>
                  <Icon name="damage" size="xs" aria-hidden={true} />
                  {item.damage}
                  {item.twoHandedDamage && ` / ${item.twoHandedDamage}`}
                </span>
              )}
              {item.AC && (
                <span>
                  <Icon name="shield" size="xs" aria-hidden={true} />
                  AC {item.AC}
                </span>
              )}
            </div>
          </div>

          {/* Equipment Controls */}
          {editable && (
            <div className="equip-controls">
              {/* Wearing Switch for armor and shields */}
              {isWearableItem(item) && (
                <Switch
                  label="Wearing"
                  checked={!!item.wearing}
                  onCheckedChange={() => toggleWearing(item.originalIndex)}
                  size="sm"
                  aria-label={`Toggle wearing ${item.name}`}
                />
              )}

              {/* Edit button */}
              <Button
                onClick={() => handleEquipmentEdit(item.originalIndex)}
                variant="secondary"
                size="sm"
                aria-label={`Edit ${item.name}`}
              >
                Edit
              </Button>

              {/* Remove button */}
              <Button
                onClick={() => handleEquipmentRemove(item.originalIndex)}
                variant="destructive"
                size="sm"
                aria-label={`Remove ${item.name}`}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      );
    },
    [editable, toggleWearing, handleEquipmentEdit, handleEquipmentRemove, formatCost, formatWeight, isWearableItem],
  );

  // Show skeleton while loading
  if (loading || !character) {
    return (
      <SectionWrapper title="Equipment" size={size} className={className}>
        <SkeletonList items={5} showAvatar={false} label="Loading equipment..." />
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper
      title={
        <div className="section-title">
          <span>Equipment</span>
          {editable && (
            <div className="section-tools">
              <Button
                onClick={toggleSelector}
                variant="secondary"
                size="sm"
                aria-expanded={showSelector}
                aria-controls="equipment-selector"
              >
                {showSelector ? 'Hide Shop' : 'Add Equipment'}
              </Button>
              <Button onClick={openCustomModal} variant="primary" size="sm" aria-label="Create custom equipment">
                Create Custom
              </Button>
            </div>
          )}
        </div>
      }
      size={size}
      className={className}
    >
      <div className="sheet-pad" data-size={size}>
        {/* Equipment Selector */}
        {showSelector && (
          <div id="equipment-selector" className="equip-shop">
            <EquipmentSelector character={character} onEquipmentAdd={handleEquipmentAdd} />
          </div>
        )}

        {/* Equipment List */}
        {cleanEquipmentArray(character.equipment).length === 0 ? (
          <Card variant="standard" className="equip-empty">
            <Typography variant="body" color="secondary">
              No equipment found
            </Typography>
            {editable && (
              <Typography variant="bodySmall" color="muted">
                Click "Add Equipment" to browse available gear or "Create Custom" to make your own
              </Typography>
            )}
          </Card>
        ) : (
          <Accordion
            items={equipmentForAccordion}
            sortBy="category"
            searchPlaceholder="Search equipment..."
            renderItem={renderEquipmentItem}
            showSearch={cleanEquipmentArray(character.equipment).length > SEARCH_THRESHOLD} // Only show search if there are many items
            showCounts={true}
          />
        )}

        {/* Custom Equipment Modal */}
        <CustomEquipmentModal isOpen={showCustomModal} onClose={closeCustomModal} onEquipmentAdd={handleCustomEquipmentAdd} />

        {/* Edit Equipment Modal */}
        {editingItem && editForm && (
          <Modal isOpen={true} onClose={handleEditCancel} title={`Edit ${editingItem.item.name}`} size="md">
            <div className="form-stack">
              {/* Name */}
              <FormField label="Name">
                <TextInput value={editForm.name} onChange={(value) => updateEditForm('name', value)} />
              </FormField>

              {/* Amount */}
              <FormField label="Amount">
                <NumberInput value={editForm.amount} onChange={(value) => updateEditForm('amount', value || 1)} minValue={1} step={1} />
              </FormField>

              {/* Cost */}
              <div className="form-grid">
                <FormField label="Cost Value">
                  <NumberInput
                    value={editForm.costValue}
                    onChange={(value) => updateEditForm('costValue', value || 0)}
                    minValue={0}
                    step={0.01}
                  />
                </FormField>
                <Select
                  label="Currency"
                  value={editForm.costCurrency}
                  onValueChange={(value) => updateEditForm('costCurrency', value as 'gp' | 'sp' | 'cp')}
                  options={[
                    { value: 'gp', label: 'gp' },
                    { value: 'sp', label: 'sp' },
                    { value: 'cp', label: 'cp' },
                  ]}
                />
              </div>

              {/* Weight */}
              <FormField label="Weight (lbs)">
                <NumberInput value={editForm.weight} onChange={(value) => updateEditForm('weight', value || 0)} minValue={0} step={0.1} />
              </FormField>

              {/* Category */}
              <FormField label="Category">
                <TextInput value={editForm.category || ''} onChange={(value) => updateEditForm('category', value)} />
              </FormField>

              {/* Description */}
              <FormField label="Description">
                <TextArea
                  value={editForm.description || ''}
                  onChange={(value) => updateEditForm('description', value)}
                  placeholder="Optional description for this equipment..."
                  rows={3}
                />
              </FormField>

              {/* Weapon properties */}
              {(editForm.damage || editForm.twoHandedDamage) && <WeaponProperties editForm={editForm} updateEditForm={updateEditForm} />}

              {/* Armor properties */}
              {(editForm.AC || editForm.missileAC) && <ArmorProperties editForm={editForm} updateEditForm={updateEditForm} />}

              {/* Modal actions */}
              <div className="form-actions">
                <Button onClick={handleEditCancel} variant="secondary" size="md">
                  Cancel
                </Button>
                <Button onClick={handleEditSave} variant="primary" size="md">
                  Save Changes
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </SectionWrapper>
  );
}
