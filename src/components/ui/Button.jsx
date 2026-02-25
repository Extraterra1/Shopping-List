import PropTypes from 'prop-types';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  icon: Icon,
  disabled = false,
  style = {},
  ...rest
}) => {
  const baseStyles = {
    padding: '12px 24px',
    borderRadius: 'var(--radius-lg)',
    fontSize: '1rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    transition: 'transform 0.1s ease, background-color 0.2s ease',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer'
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--accent-color)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
    },
    secondary: {
      backgroundColor: 'rgba(0,0,0,0.05)',
      color: 'var(--text-primary)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--accent-color)',
      padding: '8px 16px'
    },
    danger: {
      backgroundColor: 'rgba(255, 59, 48, 0.1)',
      color: 'var(--danger-color)'
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      style={{ ...baseStyles, ...variants[variant], ...style }}
      className={className}
      disabled={disabled}
      {...rest}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  icon: PropTypes.elementType,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  'aria-label': PropTypes.string,
  'data-testid': PropTypes.string,
};

export default Button;
