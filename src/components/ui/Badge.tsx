import React from 'react';
import { cn } from '@/lib/utils';
import type { TripStatus } from '@/types';
import { statusLabels } from '@/types';

type BadgeVariant = 'planning' | 'ongoing' | 'completed' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  planning: 'badge-planning',
  ongoing: 'badge-ongoing',
  completed: 'badge-completed',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  className,
}) => {
  return (
    <span className={cn('badge', variantClasses[variant], className)}>
      {children}
    </span>
  );
};

interface TripStatusBadgeProps {
  status: TripStatus;
  className?: string;
}

export const TripStatusBadge: React.FC<TripStatusBadgeProps> = ({
  status,
  className,
}) => {
  return (
    <Badge variant={status} className={className}>
      {statusLabels[status]}
    </Badge>
  );
};

interface BudgetBadgeProps {
  percentage: number;
  className?: string;
}

export const BudgetBadge: React.FC<BudgetBadgeProps> = ({
  percentage,
  className,
}) => {
  let variant: BadgeVariant = 'success';
  let label = `${percentage}%`;

  if (percentage >= 100) {
    variant = 'danger';
    label = `超支 ${percentage - 100}%`;
  } else if (percentage >= 80) {
    variant = 'warning';
    label = `${percentage}%`;
  }

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};
