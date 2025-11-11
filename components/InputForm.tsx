import React, { useState } from 'react';

export const InputForm = ({ onSubmit, isLoading, placeholder, buttonText }) => {
  const [prompt, setPrompt] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };
  return React.createElement('form', { onSubmit: handleSubmit, className: 'w-full max-w-2xl mx-auto' },
    React.createElement('div', { className: 'relative' },
      React.createElement('input', {
        type: 'text',
        value: prompt,
        onChange: (e) => setPrompt(e.target.value),
        placeholder: placeholder || 'e.g., Describe the composition of a carbonaceous chondrite meteor',
        disabled: isLoading,
        className: 'w-full px-4 py-3 pr-28 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all duration-300 shadow-md focus:shadow-lg focus:shadow-sky-500/30'
      }),
      React.createElement('button', {
        type: 'submit',
        disabled: isLoading,
        className: 'absolute inset-y-0 right-0 flex items-center px-4 m-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-300 font-semibold'
      }, buttonText || (isLoading ? 'Processing...' : 'Generate'))
    )
  );
};