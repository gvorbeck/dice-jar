import { forwardRef } from 'react';
import { cn } from '@dice-jar/cn';
import './PageWrapper.css';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const PageWrapper = forwardRef<HTMLDivElement, PageWrapperProps>(({ children, className }, ref) => (
  <div ref={ref} className={cn('page', className)}>
    {children}
  </div>
));

PageWrapper.displayName = 'PageWrapper';

export default PageWrapper;
