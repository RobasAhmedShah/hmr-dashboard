import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(({ 
  label, 
  error, 
  helperText, 
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'input w-full px-3 py-2 border border-input bg-card text-card-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
          error && 'border-destructive focus:ring-destructive focus:border-destructive',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
