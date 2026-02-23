import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'solid' | 'default';
  hover?: boolean;
  onClick?: () => void;
}

const GlassCard = ({
  children,
  className = '',
  variant = 'light',
  hover = false,
  onClick,
}: GlassCardProps) => {
  const variants = {
    light: 'glass-light',
    solid: 'glass-solid',
    default: 'glass-card',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        variants[variant],
        'rounded-3xl p-6 md:p-10',
        hover && 'hover-lift hover-glow cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
