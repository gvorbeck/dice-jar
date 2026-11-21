import type { ScrollCreationProject } from '@/types';
import { Badge, Card, Typography } from '@/components/ui/core/display';
import { Button } from '@/components/ui/core/primitives';
import { SectionHeader } from '@/components/ui/composite';
import './../ScrollCreation.css';

interface CompletedScrollsProps {
  projects: ScrollCreationProject[];
  isOwner: boolean;
  onDeleteProject: (projectId: string) => void;
}

export const CompletedScrolls = ({ projects, isOwner, onDeleteProject }: CompletedScrollsProps) => {
  if (projects.length === 0) return null;

  return (
    <div className="scrolls-done">
      <SectionHeader title="Completed Scrolls" size="md" />
      <div className="scrolls-list">
        {projects.map((project) => (
          <Card key={project.id} className="scroll-done">
            <div className="scroll-done-row">
              <div>
                <Typography variant="body">{project.spellName}</Typography>
                <div className="scroll-tags">
                  <Badge size="sm">Level {project.spellLevel}</Badge>
                  <Badge variant="primary" size="sm">
                    Completed
                  </Badge>
                </div>
                {project.notes && (
                  <div className="scroll-notes">
                    <strong>Notes:</strong> {project.notes}
                  </div>
                )}
              </div>
              <div className="scroll-cost">
                <div>
                  <div>{project.costTotal} gp</div>
                  <div>
                    {project.daysRequired} {project.daysRequired === 1 ? 'day' : 'days'}
                  </div>
                </div>
                {isOwner && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDeleteProject(project.id)}
                    icon="close"
                    iconSize="xs"
                    title="Delete completed scroll"
                  />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
