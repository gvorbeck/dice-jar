import type { ReactNode } from 'react';
import { useStepAnnouncements } from '@/hooks';
import { useValidationAnnouncements } from '@/hooks';
import { memo, useEffect, useCallback } from 'react';
import { Typography, Card } from '@/components/ui/core/display';
import { Button, Icon } from '@/components/ui';
import { TextHeader } from './TextHeader';
import List, { StepListItem } from './List';
import './Stepper.css';

interface StepItem {
  title: string;
  content: string | ReactNode;
}

interface StepperProps {
  step?: number;
  setStep?: (step: number) => void;
  stepItems: StepItem[];
  nextDisabled?: boolean;
  prevDisabled?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  validationMessage?: string;
}

function Stepper({
  step = 0,
  setStep = () => {},
  stepItems,
  nextDisabled = false,
  prevDisabled = false,
  onNext,
  onPrevious,
  validationMessage,
}: StepperProps) {
  // Ensure currentStep is within bounds
  const safeCurrentStep = Math.max(0, Math.min(step, stepItems.length - 1));
  const currentStepItem = stepItems[safeCurrentStep];

  // Announce step changes to screen readers
  useStepAnnouncements(safeCurrentStep, stepItems);

  // Announce validation errors to screen readers
  const { announceValidationErrors } = useValidationAnnouncements();

  // Announce validation messages when they change
  useEffect(() => {
    if (validationMessage) {
      announceValidationErrors([validationMessage], `Step ${safeCurrentStep + 1}`);
    }
  }, [validationMessage, safeCurrentStep, announceValidationErrors]);

  const handleStepChange = useCallback(
    (direction: 'next' | 'previous') => {
      if (direction === 'next') {
        if (onNext) {
          onNext();
        } else {
          setStep(safeCurrentStep + 1);
        }
      } else {
        if (onPrevious) {
          onPrevious();
        } else {
          setStep(safeCurrentStep - 1);
        }
      }
    },
    [onNext, onPrevious, safeCurrentStep, setStep],
  );

  // Add keyboard navigation for step controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keys when focus is within the stepper
      if (!event.target || !(event.target as Element).closest('[role="region"]')) {
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (safeCurrentStep > 0 && !prevDisabled) {
          handleStepChange('previous');
        }
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        if (safeCurrentStep < stepItems.length - 1 && !nextDisabled) {
          handleStepChange('next');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [safeCurrentStep, stepItems.length, nextDisabled, prevDisabled, handleStepChange]);

  const handleStepClick = (index: number) => {
    if (index <= safeCurrentStep) {
      setStep(index);
    }
  };

  if (!stepItems || stepItems.length === 0) {
    return <div>No steps available</div>;
  }

  return (
    <div className="stepper" role="region" aria-labelledby="stepper-heading" aria-describedby="stepper-instructions">
      {/* Hidden instructions for keyboard navigation */}
      <div id="stepper-instructions" className="sr-only">
        Use arrow keys to navigate between steps when focused within this area. Tab to navigate between interactive elements.
      </div>
      {/* Screen reader announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Step {safeCurrentStep + 1} of {stepItems.length}: {currentStepItem?.title || 'Unknown step'}
      </div>

      {/* Step Navigation - Hidden on mobile, visible on large screens */}
      <aside className="stepper-aside">
        <nav role="navigation" aria-label="Step navigation" className="stepper-nav">
          <Typography variant="sectionHeading">Steps</Typography>
          <List variant="steps" spacing="loose" aria-label="Progress steps">
            {stepItems.map((item, index) => {
              const isActive = index === safeCurrentStep;
              const isCompleted = index < safeCurrentStep;
              const isAccessible = index <= safeCurrentStep;

              const state = isActive ? 'active' : isCompleted ? 'completed' : 'upcoming';

              return (
                <StepListItem key={index}>
                  <button
                    onClick={() => handleStepClick(index)}
                    disabled={!isAccessible}
                    className="stepper-step"
                    data-state={state}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={`Step ${index + 1}: ${item.title}${isCompleted ? ' (completed)' : ''}`}
                  >
                    <div className="stepper-number">
                      {isCompleted ? <Icon name="check" size="md" aria-hidden={true} /> : <span aria-hidden="true">{index + 1}</span>}
                    </div>
                    <div className="stepper-step-text">
                      <TextHeader variant="h6" size="sm" underlined={false}>
                        {item.title}
                      </TextHeader>
                      {isActive && <div className="stepper-step-note">Current step</div>}
                      {isCompleted && <div className="stepper-step-note">Completed</div>}
                    </div>
                  </button>
                </StepListItem>
              );
            })}
          </List>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="stepper-main">
        {/* Mobile Step Indicator */}
        <div className="stepper-mobile">
          <Card variant="standard">
            <div className="stepper-mobile-head">
              <Typography variant="sectionHeading" color="zinc" as="h3">
                Step {safeCurrentStep + 1} of {stepItems.length}
              </Typography>
              <div className="stepper-percent">{Math.round(((safeCurrentStep + 1) / stepItems.length) * 100)}%</div>
            </div>
            <progress
              className="stepper-progress"
              value={safeCurrentStep + 1}
              max={stepItems.length}
              aria-label={`Step ${safeCurrentStep + 1} of ${stepItems.length}`}
            />
          </Card>
        </div>

        {/* Step Controls */}
        <nav role="navigation" aria-label="Step controls" className="stepper-controls">
          <Button
            onClick={() => handleStepChange('previous')}
            disabled={prevDisabled || safeCurrentStep === 0}
            variant="ghost"
            size="lg"
            className="stepper-prev"
            icon="chevron-left"
            iconSize="md"
            aria-label={`Go to previous step: ${safeCurrentStep > 0 ? stepItems[safeCurrentStep - 1]?.title || 'Previous step' : ''}`}
          >
            Previous
          </Button>

          <Button
            onClick={() => handleStepChange('next')}
            disabled={nextDisabled || (safeCurrentStep === stepItems.length - 1 && !onNext)}
            variant="primary"
            size="lg"
            className="stepper-next"
            {...(safeCurrentStep < stepItems.length - 1 && {
              icon: 'chevron-right',
              iconSize: 'md',
            })}
            aria-label={`Go to next step: ${
              safeCurrentStep < stepItems.length - 1 ? stepItems[safeCurrentStep + 1]?.title || 'Next step' : 'Complete'
            }`}
          >
            {safeCurrentStep === stepItems.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </nav>

        {/* Validation Message */}
        {validationMessage && (
          <div className="stepper-error">
            <div role="alert" aria-live="polite" className="stepper-error-box">
              <Icon name="exclamation-triangle" size="md" aria-hidden={true} />
              <div>{validationMessage}</div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <section aria-labelledby="step-content-heading" role="tabpanel" aria-live="polite" className="stepper-content">
          <Typography variant="h2" as="h2" id="step-content-heading" weight="bold" color="zinc">
            {currentStepItem?.title || 'Step'}
          </Typography>
          <div>{currentStepItem?.content}</div>
        </section>
      </main>
    </div>
  );
}

export default memo(Stepper);
