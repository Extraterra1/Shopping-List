import PropTypes from 'prop-types';

const Input = ({ value, onChange, placeholder, type = 'text', autoFocus = false, ...rest }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      {...rest}
      style={{
        width: '100%',
        padding: '16px',
        fontSize: '16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(125, 125, 130, 0.45)',
        backgroundColor: 'var(--surface-color)',
        color: 'var(--text-primary)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 1px 3px rgba(0,0,0,0.08)',
      }}
    />
  );
};

Input.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  autoFocus: PropTypes.bool,
  'aria-label': PropTypes.string,
  'data-testid': PropTypes.string,
};

export default Input;
