import { useNavigate } from 'react-router-dom';
import { PageMeta } from '@/components/app/PageMeta/PageMeta';
import { PageLayout } from '@/components/app/PageLayout/PageLayout';
import { Button, Heading, Text } from '@/components/ui';

export const NotFound = () => {
  const navigate = useNavigate();
  const handleReturnHome = () => navigate('/');

  return (
    <PageLayout simple>
      <PageMeta title="404 — Lost | Hearthfire" description="You've wandered off the path." />
      <div className="not-found-page">
        <div className="not-found-content">
          <Text aria-label="404 error" className="not-found-code">
            404
          </Text>
          <Heading as="h1" size="xl" className="not-found-heading">
            You've wandered off the path.
          </Heading>
          <Text color="muted">Nothing here but cold ash.</Text>
          <Button onClick={handleReturnHome} size="lg">
            Return Home
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};
