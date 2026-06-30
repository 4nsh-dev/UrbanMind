import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'motion/react';
import { ThemeContext, borderRadius, elevation } from '../utils/theme';
import { LucideIcon } from 'lucide-react';

/* ==========================================================================
   THEME PROVIDER
   ========================================================================== */

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function M3ThemeProvider({ children }: ThemeProviderProps) {
  const theme = 'light';

  const toggleTheme = () => {
    // No-op to prevent any theme changes
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    // No-op to prevent any theme changes
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    localStorage.setItem('urbanmind-theme', 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ==========================================================================
   MATERIAL ICON COMPONENT
   ========================================================================== */

interface MaterialIconProps {
  name: string;
  className?: string;
  filled?: boolean;
  lucideFallback?: LucideIcon;
}

/**
 * Google Material Symbols Rounded Icon with automatic Lucide fallback.
 * Renders high-quality native Material Symbols using Google Fonts.
 */
export function MaterialIcon({ name, className = '', filled = false, lucideFallback: LucideFallback }: MaterialIconProps) {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    // Check if Material Symbols font is loaded/active in document
    if (document.fonts) {
      document.fonts.ready.then(() => {
        setFontLoaded(document.fonts.check('24px "Material Symbols Rounded"'));
      });
    } else {
      setFontLoaded(true); // Fallback for older browsers
    }
  }, []);

  // Format naming conventions (e.g. "map_pin" -> "map_pin" or standard Material names)
  const formattedName = name.toLowerCase().replace(/[\s-]/g, '_');

  if (!fontLoaded && LucideFallback) {
    return <LucideFallback className={`w-5 h-5 ${className}`} />;
  }

  return (
    <span 
      className={`material-symbols-rounded select-none align-middle inline-block text-[24px] leading-none shrink-0 ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        fontStyle: 'normal',
        textTransform: 'none',
        wordWrap: 'normal',
        whiteSpace: 'nowrap',
        direction: 'ltr',
        WebkitFontSmoothing: 'antialiased',
        textRendering: 'optimizeLegibility',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      {formattedName}
    </span>
  );
}

/* ==========================================================================
   BUTTON COMPONENT (5 SPECS AS PER MD3)
   ========================================================================== */

export { useTheme } from '../utils/theme';

export interface M3ButtonProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: 'filled' | 'elevated' | 'tonal' | 'outlined' | 'text';
  icon?: string;
  lucideIcon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export function M3Button({
  children,
  variant = 'filled',
  icon,
  lucideIcon,
  iconPosition = 'left',
  loading = false,
  className = '',
  disabled,
  ...props
}: M3ButtonProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  const baseClasses = "relative px-6 py-2.5 rounded-full text-sm font-medium tracking-wide flex items-center justify-center gap-2.5 transition-shadow duration-250 select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35 overflow-hidden";

  const variantClasses = {
    filled: "bg-md-primary hover:bg-md-primary/90 text-md-on-primary focus-visible:ring-md-primary shadow-xs hover:shadow-md",
    elevated: "bg-md-surface hover:bg-md-surface-variant/40 text-md-primary border border-md-outline/10 shadow-md-elevation-1 hover:shadow-md-elevation-2 focus-visible:ring-md-primary",
    tonal: "bg-md-primary-container hover:bg-md-primary-container/85 text-md-on-primary-container focus-visible:ring-md-primary shadow-xs hover:shadow-md",
    outlined: "bg-transparent hover:bg-md-primary/5 text-md-primary border border-md-outline hover:border-md-primary focus-visible:ring-md-primary",
    text: "bg-transparent hover:bg-md-primary/8 text-md-primary focus-visible:ring-md-primary px-4"
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
    };
    
    setRipples((prev) => [...prev, newRipple]);
  };

  const removeRipple = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  const renderIcon = () => {
    if (loading) {
      return (
        <svg className="animate-spin -ml-1 mr-1 h-4.5 w-4.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    if (icon) {
      return <MaterialIcon name={icon} className="text-[18px] w-4.5 h-4.5 flex items-center justify-center" lucideFallback={lucideIcon} />;
    }
    if (lucideIcon) {
      const LucideComp = lucideIcon;
      return <LucideComp className="w-4.5 h-4.5" />;
    }
    return null;
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onPointerDown={handlePointerDown}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {/* Ripple overlay */}
      <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none z-0">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.22 }}
              animate={{ scale: 1, opacity: 0 }}
              exit={{ opacity: 0 }}
              onAnimationComplete={() => removeRipple(ripple.id)}
              transition={{ duration: 0.45, ease: [0.1, 0.8, 0.3, 1] }}
              style={{
                position: 'absolute',
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
                borderRadius: '50%',
                backgroundColor: variant === 'filled' ? 'rgba(255, 255, 255, 0.45)' : 'currentColor',
              }}
            />
          ))}
        </AnimatePresence>
      </span>

      <span className="relative z-10 flex items-center justify-center gap-2.5">
        {iconPosition === 'left' && renderIcon()}
        <span>{children}</span>
        {iconPosition === 'right' && renderIcon()}
      </span>
    </motion.button>
  );
}

/* ==========================================================================
   CARD COMPONENT (ELEVATED, FILLED, OUTLINED WITH HIGH-FIDELITY HOVER ELEVATION)
   ========================================================================== */

export interface M3CardProps extends HTMLMotionProps<'div'> {
  variant?: 'elevated' | 'filled' | 'outlined';
  hoverable?: boolean;
}

export function M3Card({
  children,
  variant = 'elevated',
  hoverable = true,
  className = '',
  ...props
}: M3CardProps) {
  
  const baseClasses = "bg-md-surface border text-md-on-surface rounded-3xl p-6 overflow-hidden";

  const variantClasses = {
    elevated: "bg-md-surface border-md-outline/5 shadow-md-elevation-1",
    filled: "bg-md-surface-variant/35 border-transparent",
    outlined: "bg-transparent border-md-outline-variant/65"
  };

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileHover={hoverable ? { 
        y: -4, 
        scale: 1.01,
        boxShadow: "0px 12px 24px -10px rgba(0, 0, 0, 0.12), 0px 4px 12px -5px rgba(0, 0, 0, 0.08)"
      } : undefined}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ==========================================================================
   CHIP COMPONENT (MD3 SPEC)
   ========================================================================== */

export interface M3ChipProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  selected?: boolean;
  icon?: string;
  lucideIcon?: LucideIcon;
  onDelete?: (e: React.MouseEvent) => void;
}

export function M3Chip({
  children,
  selected = false,
  icon,
  lucideIcon,
  onDelete,
  className = '',
  disabled = false,
  ...props
}: M3ChipProps) {
  
  const baseClasses = "px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 cursor-pointer border select-none transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none";
  
  const stateClasses = selected
    ? "bg-md-primary-container text-md-on-primary-container border-transparent shadow-xs"
    : "bg-md-surface hover:bg-md-surface-variant/30 text-md-on-surface border-md-outline-variant";

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${baseClasses} ${stateClasses} ${className}`}
      {...props}
    >
      {selected && !icon && !lucideIcon && (
        <span className="material-symbols-rounded text-[14px] leading-none shrink-0 text-current select-none">
          check
        </span>
      )}
      {icon && <MaterialIcon name={icon} className="text-[14px] w-3.5 h-3.5" lucideFallback={lucideIcon} />}
      {!icon && lucideIcon && (() => {
        const LucideComp = lucideIcon;
        return <LucideComp className="w-3.5 h-3.5" />;
      })()}
      <span>{children}</span>
      {onDelete && (
        <span 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          className="material-symbols-rounded text-[14px] text-md-on-surface-variant hover:text-md-on-surface ml-1 p-0.5 rounded-full hover:bg-md-surface-variant/40"
        >
          close
        </span>
      )}
    </button>
  );
}

/* ==========================================================================
   FORM INPUTS (OUTLINED STYLE WITH SOLID FLOATING-LABEL INSPIRED INTERACTION)
   ========================================================================== */

interface M3InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: string;
  lucideIcon?: LucideIcon;
  className?: string;
  id?: string;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
}

export function M3Input({
  label,
  error,
  icon,
  lucideIcon,
  className = '',
  id,
  onFocus,
  onBlur,
  ...props
}: M3InputProps) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const uniqueId = id || `m3-input-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    setHasValue(Boolean(props.value || props.defaultValue));
  }, [props.value, props.defaultValue]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    setHasValue(Boolean(e.target.value));
    if (onBlur) onBlur(e);
  };

  const isLabelFloating = focused || hasValue;

  return (
    <div className={`relative w-full text-left mb-1.5 ${className}`}>
      {/* Border wrapper & input container */}
      <div className={`relative flex items-center w-full min-h-[56px] rounded-xl border px-3 transition-all duration-200 bg-md-surface-variant/10 ${
        error 
          ? 'border-md-error focus-within:border-md-error focus-within:ring-1 focus-within:ring-md-error' 
          : focused 
            ? 'border-md-primary focus-within:ring-1 focus-within:ring-md-primary' 
            : 'border-md-outline/60 hover:border-md-on-surface-variant/60'
      }`}>
        
        {/* Left icon if specified */}
        {icon && (
          <MaterialIcon 
            name={icon} 
            className={`mr-2 ${error ? 'text-md-error' : focused ? 'text-md-primary' : 'text-md-on-surface-variant'}`} 
            lucideFallback={lucideIcon}
          />
        )}
        {!icon && lucideIcon && (() => {
          const LucideComp = lucideIcon;
          return <LucideComp className={`w-5 h-5 mr-2 shrink-0 ${error ? 'text-md-error' : focused ? 'text-md-primary' : 'text-md-on-surface-variant'}`} />;
        })()}

        {/* Floating Label */}
        <label 
          htmlFor={uniqueId}
          className={`absolute left-3.5 pointer-events-none transition-all duration-200 select-none ${
            isLabelFloating 
              ? 'top-1.5 text-[10px] font-bold tracking-wider uppercase ' + (error ? 'text-md-error' : focused ? 'text-md-primary' : 'text-md-on-surface-variant')
              : 'top-1/2 -translate-y-1/2 text-sm text-md-on-surface-variant'
          }`}
        >
          {label}
        </label>

        {/* Native Input */}
        <input
          id={uniqueId}
          className="w-full bg-transparent border-none outline-none text-sm text-md-on-surface pt-4 pb-1 font-medium placeholder:opacity-0 focus:placeholder:opacity-30 placeholder:text-md-on-surface-variant"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </div>

      {/* Error helper text */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[11px] font-semibold text-md-error mt-1.5 pl-3"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ==========================================================================
   MD3 SWITCH COMPONENT
   ========================================================================== */

interface M3SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function M3Switch({ checked, onChange, disabled = false }: M3SwitchProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors outline-none focus:ring-2 focus:ring-md-primary/20 ${
        checked ? 'bg-md-primary' : 'bg-md-outline-variant'
      } ${disabled ? 'opacity-35 pointer-events-none' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

/* ==========================================================================
   DIALOGS & MODAL COMPONENT (MD3 CORNER ACCENT 28PX)
   ========================================================================== */

interface M3DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function M3Dialog({
  isOpen,
  onClose,
  title,
  children,
  actions
}: M3DialogProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Modal Box (MD3 spec: corner-radius 28px) */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-md-surface text-md-on-surface rounded-[28px] max-w-md w-full p-6 shadow-md-elevation-3 border border-md-outline/10 overflow-hidden z-10 flex flex-col gap-4 text-left"
          >
            <div className="space-y-1.5">
              <h3 className="text-xl font-medium tracking-tight text-md-on-surface">
                {title}
              </h3>
            </div>

            <div className="text-sm text-md-on-surface-variant flex-1 max-h-[60vh] overflow-y-auto pr-1">
              {children}
            </div>

            {actions && (
              <div className="flex justify-end gap-2 shrink-0 pt-2">
                {actions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
