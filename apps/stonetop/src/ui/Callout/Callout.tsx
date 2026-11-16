import { Heading } from '@/ui/Heading/Heading';

type Props = {
  title: string;
  children: React.ReactNode;
};

export const Callout = ({ title, children }: Props) => (
  <div className="callout-callout">
    <Heading as="h3" size="sm">
      {title}
    </Heading>
    {children}
  </div>
);
