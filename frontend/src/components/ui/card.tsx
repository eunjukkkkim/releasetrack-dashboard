import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Atlassian Card — white bg, radius 20px, padding 24px, hairline border.
 * Keeps the existing 5-part export shape (Card/CardHeader/CardTitle/
 * CardDescription/CardContent). Maps to the `.rt-card*` classes so descendant
 * selectors used by pages (e.g. `.chart-card .rt-card-content`,
 * `.rt-card-header-row`) keep matching — zero layout regression.
 */
export const Card = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => <section ref={ref} className={cn('rt-card', className)} {...props} />,
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('rt-card-header', className)} {...props} />,
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h2 ref={ref} className={cn('rt-card-title', className)} {...props} />,
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn('rt-card-description', className)} {...props} />,
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('rt-card-content', className)} {...props} />,
);
CardContent.displayName = 'CardContent';
