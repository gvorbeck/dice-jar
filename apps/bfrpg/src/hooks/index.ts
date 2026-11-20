// Auth hooks
export { useAuth } from './auth';

// UI hooks
export { useModal, useLoadingState, useNotificationContext, useInitialLoadingState } from './ui';

// Form and validation hooks
export { useFormValidation, useDebounce, useDebouncedUpdate, useValidationAnnouncements } from './forms';

// Character hooks
export { useCharacterCard, usePlayerCharacters, useHPGain } from './character';

// Equipment hooks
export { useEquipmentManagement, useEquipmentManager } from './equipment';

// Dice and combat hooks
export { useDiceRoll, useCombatLogic } from './dice';

// Data and skill hooks
export { useAppData, useSkillDataByClass, useSkillColumns } from './data';

// Navigation hooks
export { useGameNavigation, useStepNavigation, useFocusManagement } from './navigation';

// Accessibility hooks
export { useStepAnnouncements } from './a11y';

// TanStack Query hooks (enhanced with error handling)
export { useDataResolver } from './queries';
export { useAuthMutations } from './mutations';

// Enhanced error handling and offline hooks
export { useNetworkStatus } from './network/useNetworkStatus';

// Direct access to enhanced hooks (for explicit usage)
