import React from 'react';

type ButtonProps = {
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = 'button', variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`px-4 py-2 rounded-md transition-colors ${{
        destructive: 'bg-red-600 hover:bg-red-700',
        outline: 'border border-gray-300 hover:bg-gray-50',
        default: 'bg-blue-600 hover:bg-blue-700'
      }[variant]} ${{
        sm: 'text-sm',
        lg: 'text-lg',
        default: 'text-base'
      }[size]} ${className}`}
      {...props}
    />
  )
);

Button.displayName = 'Button';