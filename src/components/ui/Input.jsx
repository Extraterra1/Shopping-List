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
        backgroundColor: 'rgba(0,0,0,0.03)',
        color: 'var(--text-primary)',
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
