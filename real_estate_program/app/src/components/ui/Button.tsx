import { FC, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-solana-dark-950 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-solana text-white shadow-lg shadow-solana-purple-500/25 hover:shadow-xl hover:shadow-solana-purple-500/40 hover:scale-[1.02] focus:ring-solana-purple-500 active:scale-[0.98]',
    secondary: 'bg-solana-dark-800/80 text-white border border-solana-dark-700 hover:bg-solana-dark-700 hover:border-solana-dark-600 focus:ring-solana-dark-500 hover:shadow-lg hover:shadow-black/20',
    ghost: 'text-solana-dark-300 hover:text-white hover:bg-solana-dark-800/60 focus:ring-solana-dark-500',
    success: 'bg-solana-green-500 text-solana-dark-950 font-semibold hover:bg-solana-green-400 focus:ring-solana-green-500 shadow-lg shadow-solana-green-500/25 hover:shadow-xl hover:shadow-solana-green-500/40',
    danger: 'bg-red-500/90 text-white hover:bg-red-500 focus:ring-red-500 shadow-lg shadow-red-500/25',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
