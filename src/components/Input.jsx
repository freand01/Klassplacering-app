import React from 'react';

const Input = ({
  value,
  onChange,
  placeholder,
  className = '',
  autoFocus = false,
  type = 'text',
  ariaLabel,
  id,
  name
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    autoFocus={autoFocus}
    id={id}
    name={name}
    aria-label={ariaLabel || placeholder}
    className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${className}`}
  />
);

export default Input;
