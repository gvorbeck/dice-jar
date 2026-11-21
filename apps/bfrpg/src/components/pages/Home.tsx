import { useNavigate } from 'react-router-dom';
import { useTitle } from '@dice-jar/browser';
import { Card, Image } from '@/components/ui';
import { FABGroup } from '@/components/ui/core/primitives/FloatingActionButton';
import { Icon, HeroSection, FeatureCard } from '@/components/ui/composite';
import { TextHeader } from '@/components/ui/composite/TextHeader';
import { PageWrapper } from '@/components/ui/core/layout';
import { LoadingState } from '@/components/ui/core/feedback';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/core/layout/Tabs';
import { CharactersList } from '@/components/features/character/management';
import { GamesList } from '@/components/features/game/management';
import { useAuth } from '@/hooks';
import { useEnhancedCharacters } from '@/hooks/queries/useEnhancedQueries';
import './Home.css';

function Home() {
  const { user, loading: authLoading } = useAuth();
  const { data: characters = [], isLoading: charactersLoading } = useEnhancedCharacters();
  const navigate = useNavigate();
  useTitle('Codex.Quest | Basic Fantasy RPG character generator');

  const hasCharacters = characters.length > 0;
  const showWelcomeContent = !authLoading && (!user || (!hasCharacters && !charactersLoading));

  return (
    <PageWrapper>
      <section className="home">
        {/* Show loading state while checking authentication */}
        {authLoading && (
          <Card variant="standard" size="compact" className="home-card">
            <LoadingState variant="inline" message="Loading your adventure..." />
          </Card>
        )}

        {/* Show character list for authenticated users */}
        {!authLoading && user && (
          <Card variant="standard" size="compact" className="home-card">
            <Tabs defaultValue="characters">
              <TabList aria-label="Main navigation">
                <Tab value="characters">Characters</Tab>
                <Tab value="games">Games</Tab>
              </TabList>
              <TabPanels>
                <TabPanel value="characters">
                  <CharactersList />
                </TabPanel>
                <TabPanel value="games">
                  <GamesList />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Card>
        )}

        {/* Welcome content - only show if user has no characters or not authenticated */}
        {!authLoading && showWelcomeContent && (
          <>
            <HeroSection
              title="Welcome to Codex.Quest"
              subtitle="Forge your legendary hero with our comprehensive character generator for Basic Fantasy RPG. Roll ability scores, choose from diverse races and classes, and equip your adventurer for epic quests ahead."
              logo={<Image variant="logo" src="/images/logo.webp" alt="Codex.Quest Logo" className="home-logo" />}
            />

            <Card variant="hero">
              <div className="home-forge-body">
                <TextHeader variant="h3" size="lg">
                  Forge Your Legend
                </TextHeader>

                <div className="home-features">
                  <div>
                    <FeatureCard
                      icon="dice"
                      title="Interactive Dice Rolling"
                      description="Experience the thrill of rolling ability scores with animated dice and multiple generation methods."
                    />
                    <FeatureCard
                      icon="user"
                      title="Rich Race & Class Options"
                      description="Choose from diverse races and classes, each with unique abilities and progression paths."
                    />
                  </div>

                  <div>
                    <FeatureCard
                      icon="sword"
                      title="Complete Equipment System"
                      description="Outfit your hero with weapons, armor, and gear with detailed stats and weight tracking."
                    />
                    <FeatureCard
                      icon="check-circle"
                      title="Smart Validation"
                      description="Automatic requirement checking ensures your character follows all BFRPG rules and restrictions."
                    />
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </section>

      {/* Floating Action Button Group for authenticated users */}
      {!authLoading && user && (
        <FABGroup
          actions={[
            {
              key: 'new-character',
              label: 'New Character',
              variant: 'primary' as const,
              size: 'lg' as const,
              onClick: () => navigate('/new-character?new=true'),
              children: <Icon name="dice" size="lg" aria-hidden />,
            },
            {
              key: 'new-game',
              label: 'New Game',
              variant: 'secondary' as const,
              size: 'lg' as const,
              onClick: () => navigate('/new-game'),
              children: <Icon name="shield" size="lg" aria-hidden />,
            },
          ]}
          mainAction={{
            key: 'main',
            label: 'Create',
            variant: 'primary' as const,
            size: 'lg' as const,
            children: <Icon name="plus" size="lg" aria-hidden />,
          }}
        />
      )}
    </PageWrapper>
  );
}

export default Home;
