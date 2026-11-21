import { useMemo, memo, useEffect, useState } from 'react';
import { StepWrapper, Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/core/layout';
import { SimpleRoller } from '@/components/domain/dice';
import { Button, Icon } from '@/components/ui';
import { Card, Typography, Badge } from '@/components/ui/core/display';
import { InfoCardHeader, StatGrid } from '@/components/ui/composite';
import { ErrorDisplay } from '@/components/ui/core/feedback';
import type { BaseStepProps } from '@/types';
import type { EquipmentPack } from '@/types';
import { EquipmentSelector } from '@/components/domain/equipment';
import { useEquipmentManagement } from '@/hooks';
import { useCharacterMutations } from '@/hooks/mutations/useEnhancedMutations';
import { formatCurrency } from '@/utils/currency';
import { getCharacterSpellSystemType } from '@/utils/character';
import EquipmentPackSelector from './EquipmentPackSelector';
import './EquipmentStep.css';

type EquipmentStepProps = BaseStepProps;

function EquipmentStep({ character, onCharacterChange }: EquipmentStepProps) {
  const {
    startingGold,
    handleGoldRoll,
    handleEquipmentAdd,
    handleEquipmentRemove,
    totalWeight,
    totalValue,
    cleanedEquipment,
    getStatusMessage,
  } = useEquipmentManagement(character, onCharacterChange);

  // Equipment pack state
  const [showPackSelector, setShowPackSelector] = useState(true);
  const [selectedPack, setSelectedPack] = useState<EquipmentPack | null>(null);

  // Equipment pack mutations
  const { applyEquipmentPack, isApplyingPack, packError } = useCharacterMutations({
    onPackApplied: () => {
      setShowPackSelector(false);
    },
  });

  // Handle pack selection
  const handlePackSelected = async (pack: EquipmentPack) => {
    try {
      const { character: updatedCharacter } = await applyEquipmentPack({
        character,
        pack,
      });
      onCharacterChange(updatedCharacter);
      setSelectedPack(pack);
    } catch {
      // Error is handled by the mutation hook
    }
  };

  const handleRemovePack = () => {
    setSelectedPack(null);
    setShowPackSelector(true);
    // Note: We don't remove the equipment here - user can remove items individually if needed
  };

  // Auto-add spellbook for magic-users
  const spellSystemType = useMemo(() => getCharacterSpellSystemType(character), [character]);

  const isMagicUser = spellSystemType === 'magic-user';

  const hasSpellbook = useMemo(() => character.equipment.some((item) => item.name === 'Spellbook (128 pages)'), [character.equipment]);

  // Initialize character with spellbook if they're a magic-user and don't have one
  useEffect(() => {
    if (isMagicUser && !hasSpellbook) {
      const spellbook = {
        name: 'Spellbook (128 pages)',
        costValue: 25,
        costCurrency: 'gp' as const,
        weight: 1,
        category: 'general-equipment' as const,
        subCategory: 'wizards-wares' as const,
        amount: 1,
      };

      onCharacterChange({
        ...character,
        equipment: [...character.equipment, spellbook],
      });
    }
  }, [isMagicUser, hasSpellbook, character, onCharacterChange]);

  return (
    <StepWrapper
      title="Equipment"
      description="Roll for starting gold and select your character's equipment."
      statusMessage={getStatusMessage()}
    >
      {/* Starting Gold Section */}
      <section className="step-block">
        <Typography variant="sectionHeading">Starting Gold</Typography>

        <Card variant="info" className="step-card">
          <InfoCardHeader icon={<Icon name="coin" size="md" aria-hidden={true} />} title="Gold Information" spacing="normal" />
          <Typography variant="description" color="primary">
            Roll 3d6 × 10 for your character's starting gold pieces. Use this gold to purchase equipment and supplies.
          </Typography>
        </Card>

        <Card variant="standard">
          <SimpleRoller
            formula="3d6*10"
            label="Starting Gold (3d6 × 10)"
            {...(startingGold !== undefined && {
              initialValue: startingGold,
            })}
            onChange={handleGoldRoll}
          />

          {startingGold !== undefined && (
            <div className="gold-status">
              <div>
                <Icon name="coin" size="sm" aria-hidden={true} />
                <span>Current: {formatCurrency(character.currency)}</span>
              </div>
              {startingGold !== character.currency.gold && (
                <div>
                  <Icon name="clock" size="sm" />
                  <span>Started: {startingGold} gp</span>
                </div>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* Current Equipment Section */}
      <section className="step-block">
        <Typography variant="sectionHeading">Current Equipment</Typography>

        {cleanedEquipment.length === 0 ? (
          <Card variant="standard">
            <div className="kit-none">
              <Icon name="clipboard" size="md" />
              <Typography variant="body" color="muted">
                No equipment selected yet. Browse available equipment below.
              </Typography>
            </div>
          </Card>
        ) : (
          <Card variant="success" className="kit-inventory">
            <div className="kit-title">
              <Icon name="clipboard" size="md" />
              <Typography variant="h5" color="zinc" weight="semibold">
                Equipment Inventory
              </Typography>
            </div>

            <div className="kit-items">
              {cleanedEquipment.map((item) => {
                const itemKey = `${item.name}-${item.category || 'no-cat'}-${
                  item.subCategory || 'no-sub'
                }-${item.costValue || 0}-${item.weight || 0}`;
                return (
                  <Card key={itemKey} variant="success">
                    <div className="kit-item">
                      <div>
                        <div className="kit-name">
                          <span>{item.name}</span>
                          {item.amount > 1 && <Badge variant="status">× {item.amount}</Badge>}
                        </div>
                        <div className="kit-figures">
                          {item.weight > 0 && <span>{Math.round(item.weight * item.amount * 10) / 10} lbs</span>}
                          {item.costValue > 0 && (
                            <span>
                              {item.costValue * item.amount} {item.costCurrency}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleEquipmentRemove(item.name)}>
                        Remove
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Equipment Summary */}
            <StatGrid
              stats={[
                {
                  label: 'Total Weight',
                  value: `${totalWeight} lbs`,
                  icon: <Icon name="weight" size="sm" aria-hidden={true} />,
                },
                {
                  label: 'Total Value',
                  value: `${totalValue} gp`,
                  icon: <Icon name="coin" size="sm" aria-hidden={true} />,
                },
              ]}
              variant="equipment"
            />
          </Card>
        )}
      </section>

      {/* Equipment Selection Tabs */}
      <section className="step-block">
        <Typography variant="sectionHeading">Equipment Selection</Typography>

        <Tabs defaultValue="equipment-packs">
          <TabList aria-label="Equipment selection methods">
            <Tab value="equipment-packs">Equipment Packs</Tab>
            <Tab value="individual-items">Individual Items</Tab>
          </TabList>

          <TabPanels>
            <TabPanel value="equipment-packs">
              {/* Equipment Pack Error */}
              <ErrorDisplay error={packError?.message} className="kit-error" />

              {/* Equipment Pack Selector */}
              {showPackSelector && (
                <EquipmentPackSelector character={character} onPackSelected={handlePackSelected} isLoading={isApplyingPack} />
              )}

              {/* Selected Pack Summary */}
              {selectedPack && !showPackSelector && (
                <div className="kit-pack">
                  <Card variant="success">
                    <div className="kit-pack-row">
                      <div>
                        <div className="kit-pack-title">
                          <Icon name="check" size="sm" />
                          <Typography variant="h6">{selectedPack.name}</Typography>
                        </div>
                        <Typography variant="bodySmall" color="secondary">
                          {selectedPack.description}
                        </Typography>
                        <div className="kit-pack-costs">
                          <div>
                            <Icon name="coin" size="sm" />
                            <span>{selectedPack.cost} gp spent</span>
                          </div>
                          <div>
                            <Icon name="weight" size="sm" />
                            <span>{selectedPack.weight} lb added</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemovePack} icon="plus" iconSize="sm">
                        Add Another Pack
                      </Button>
                    </div>
                  </Card>

                  <Typography variant="bodySmall" color="secondary">
                    You can still add or remove individual equipment items in the "Individual Items" tab.
                  </Typography>
                </div>
              )}
            </TabPanel>

            <TabPanel value="individual-items">
              <EquipmentSelector character={character} onEquipmentAdd={handleEquipmentAdd} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </section>
    </StepWrapper>
  );
}

export default memo(EquipmentStep);
