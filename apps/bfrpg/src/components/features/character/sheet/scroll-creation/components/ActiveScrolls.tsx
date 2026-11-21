import type { ScrollCreationProject } from '@/types';
import { Badge, Card, Typography } from '@/components/ui/core/display';
import { Button, NumberInput, FormField } from '@/components/ui/core/primitives';
import { SectionHeader } from '@/components/ui/composite';
import './../ScrollCreation.css';

interface ActiveScrollsProps {
  projects: ScrollCreationProject[];
  isOwner: boolean;
  onUpdateProject: (projectId: string, updates: Partial<ScrollCreationProject>) => void;
  onCompleteProject: (project: ScrollCreationProject) => void;
  onDeleteProject: (projectId: string) => void;
}

const getStatusBadgeVariant = (status: ScrollCreationProject['status']) => {
  switch (status) {
    case 'completed':
      return 'primary';
    case 'in-progress':
      return 'primary';
    case 'paused':
      return 'secondary';
    case 'failed':
      return 'secondary';
    default:
      return 'primary';
  }
};

const formatProgress = (project: ScrollCreationProject): string => {
  const percentage = Math.round((project.daysCompleted / project.daysRequired) * 100);
  return `${project.daysCompleted}/${project.daysRequired} days (${percentage}%)`;
};

export const ActiveScrolls = ({ projects, isOwner, onUpdateProject, onCompleteProject, onDeleteProject }: ActiveScrollsProps) => {
  if (projects.length === 0) return null;

  return (
    <div className="scrolls-block">
      <SectionHeader title="Active Scrolls" size="md" />
      <div className="scrolls-list">
        {projects.map((project) => (
          <Card key={project.id} size="compact">
            <div className="scroll-head">
              <div>
                <Typography variant="h5">{project.spellName}</Typography>
                <div className="scroll-tags">
                  <Badge>Level {project.spellLevel}</Badge>
                  <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge>
                </div>
              </div>
              {isOwner && (
                <div className="scroll-tools">
                  {project.daysCompleted >= project.daysRequired && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onCompleteProject(project)}
                      title="Complete scroll and add to inventory"
                    >
                      Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDeleteProject(project.id)}
                    icon="close"
                    iconSize="xs"
                    title="Delete scroll"
                  />
                </div>
              )}
            </div>

            <div className="scroll-facts">
              <div>
                <strong>Progress:</strong> {formatProgress(project)}
              </div>
              <div>
                <strong>Cost:</strong> {project.costPaid}/{project.costTotal} gp
              </div>
            </div>

            {project.notes && (
              <div className="scroll-notes">
                <strong>Notes:</strong> {project.notes}
              </div>
            )}

            {isOwner && (
              <div className="scroll-fields">
                <FormField label="Days completed">
                  <NumberInput
                    value={project.daysCompleted}
                    onChange={(value) =>
                      onUpdateProject(project.id, {
                        daysCompleted: value || 0,
                      })
                    }
                    minValue={0}
                    maxValue={project.daysRequired}
                  />
                </FormField>
                <FormField label="Cost paid (gp)">
                  <NumberInput
                    value={project.costPaid}
                    onChange={(value) =>
                      onUpdateProject(project.id, {
                        costPaid: value || 0,
                      })
                    }
                    minValue={0}
                    maxValue={project.costTotal}
                  />
                </FormField>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
