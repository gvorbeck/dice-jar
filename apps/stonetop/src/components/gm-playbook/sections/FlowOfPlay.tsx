import { List, Text } from '@/components/ui';
import './FlowOfPlay.css';

const NodeLabel = ({ id }: { id: string }) => <span className="flow-of-play-node-label">{id}</span>;

const GoTo = ({ node }: { node: string }) => (
  <a href={`#node-${node}`} className="flow-of-play-go-to">
    go to {node}
  </a>
);

export const FlowOfPlay = () => (
  <div className="flow-of-play-flow">
    <Text color="muted" italic className="flow-of-play-intro">
      Over multiple sessions, a game of *Stonetop* generally follows this pattern. Each node is labeled — follow the connections to see
      where play goes next.
    </Text>

    <div className="flow-of-play-nodes">
      <div className="flow-of-play-node" id="node-A">
        <NodeLabel id="A" />
        <div className="flow-of-play-node-title">First Adventure</div>
        <div className="flow-of-play-node-subtitle">(Book I, page 251)</div>
        <List variant="bullet" items={['Setup questions', 'Set the scene (at home)', 'Drop your hook', 'See how folks react']} />
        <div className="flow-of-play-node-exits">
          <span className="flow-of-play-exit">
            PCs take the hook → <GoTo node="B" />
          </span>
          <span className="flow-of-play-exit-dashed">
            PCs ignore the hook → <GoTo node="E" />
          </span>
        </div>
      </div>

      <div className="flow-of-play-node" id="node-B">
        <NodeLabel id="B" />
        <div className="flow-of-play-node-title">Expedition</div>
        <div className="flow-of-play-node-subtitle">(Book I, page 301)</div>
        <List variant="bullet" items={['Preparations', 'Legs of travel/points of interest', 'Challenges, surprises, resolution']} />
        <div className="flow-of-play-node-exits">
          <span className="flow-of-play-exit">
            <GoTo node="C" />
          </span>
        </div>
      </div>

      <div className="flow-of-play-node" id="node-C">
        <NodeLabel id="C" />
        <div className="flow-of-play-node-title">Aftermath</div>
        <div className="flow-of-play-node-subtitle">(Book I, page 490)</div>
        <List
          variant="bullet"
          items={["Determine what's happened", 'Play out the return/post-crisis', 'See what follows', 'Transition to downtime']}
        />
        <div className="flow-of-play-node-exits">
          <span className="flow-of-play-exit">
            <GoTo node="E" />
          </span>
        </div>
      </div>

      <div className="flow-of-play-node" id="node-D">
        <NodeLabel id="D" />
        <div className="flow-of-play-node-title">Crisis</div>
        <div className="flow-of-play-node-subtitle">(Book I, page 499)</div>
        <List variant="bullet" items={['Trouble erupts at home', 'Play it out, see what happens', 'Quite possibly Meet With Disaster']} />
        <div className="flow-of-play-node-exits">
          <span className="flow-of-play-exit">
            PCs stay home → <GoTo node="C" />
          </span>
          <span className="flow-of-play-exit">
            PCs head out in response → <GoTo node="B" />
          </span>
        </div>
      </div>

      <div className="flow-of-play-node" id="node-E">
        <NodeLabel id="E" />
        <div className="flow-of-play-node-title">Downtime</div>
        <div className="flow-of-play-node-subtitle">(Book I, page 496)</div>
        <List
          variant="bullet"
          items={[
            'Zoom out, deal with logistics',
            'Establish goals and intentions',
            'Play out situations as needed',
            'Show the passing of time',
          ]}
        />
        <div className="flow-of-play-node-exits">
          <span className="flow-of-play-exit">
            As a hard GM move → <GoTo node="D" />
          </span>
          <span className="flow-of-play-exit">
            Opportunity, threat(s), or requirement → <GoTo node="B" />
          </span>
          <span className="flow-of-play-exit">
            Eventually → <GoTo node="F" />
          </span>
        </div>
      </div>

      <div className="flow-of-play-node" id="node-F">
        <NodeLabel id="F" />
        <div className="flow-of-play-node-title">Seasons Change</div>
        <div className="flow-of-play-node-subtitle">(Book I, page 516)</div>
        <List
          variant="bullet"
          items={[
            'Zoom out, deal with logistics',
            'Establish goals and intentions',
            'Play out situations as needed',
            'Show the passing of time',
          ]}
        />
        <div className="flow-of-play-node-exits">
          <span className="flow-of-play-exit">
            Threat(s) → <GoTo node="D" />
          </span>
          <span className="flow-of-play-exit">
            Opportunity or threat(s) → <GoTo node="B" />
          </span>
          <span className="flow-of-play-exit">
            Quiet (for now) → <GoTo node="E" />
          </span>
        </div>
      </div>
    </div>
  </div>
);
