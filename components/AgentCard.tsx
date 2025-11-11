import React from 'react';
import { LoadingSpinner } from './icons.tsx';
import type { Agent } from '../types.ts';

export const AgentCard = ({ agent }: { agent: Agent }) => {
  const statusStyles: Record<Agent['status'], { bg: string, text: string, label: string }> = {
    idle: { bg: 'bg-slate-600', text: 'text-slate-200', label: 'Idle' },
    thinking: { bg: 'bg-yellow-400/20', text: 'text-yellow-300', label: 'Thinking' },
    refining: { bg: 'bg-purple-400/20', text: 'text-purple-300', label: 'Refining' },
    calling_tools: { bg: 'bg-indigo-400/20', text: 'text-indigo-300', label: 'Calling Tools' },
    done: { bg: 'bg-green-400/20', text: 'text-green-300', label: 'Done' },
    error: { bg: 'bg-red-400/20', text: 'text-red-300', label: 'Error' },
  };
  const statusGlowClasses: Record<Agent['status'], string> = {
    idle: 'glow-idle',
    thinking: 'glow-thinking',
    refining: 'glow-refining',
    calling_tools: 'glow-calling_tools',
    done: 'glow-done',
    error: 'glow-error',
  };
  const style = statusStyles[agent.status];
  const glowClass = statusGlowClasses[agent.status];
  const isProcessing = agent.status === 'thinking' || agent.status === 'refining' || agent.status === 'calling_tools';
  
  return React.createElement('div', { className: `bg-slate-900/70 backdrop-blur-md border rounded-xl p-5 shadow-lg transition-all duration-500 h-full flex flex-col ${glowClass}` },
    React.createElement('div', { className: 'flex justify-between items-center mb-3' },
      React.createElement('h3', { className: 'text-xl font-bold text-white' }, `${agent.name}: `, React.createElement('span', { className: 'font-normal text-gray-300' }, agent.role)),
      React.createElement('span', { className: `px-3 py-1 text-sm font-semibold rounded-full ${style.bg} ${style.text}` }, style.label)
    ),
    React.createElement('div', { className: 'flex-grow min-h-[100px] bg-black/30 rounded-md p-3 text-slate-300 text-sm overflow-y-auto' },
      isProcessing && React.createElement('div', { className: 'flex flex-col items-center justify-center h-full' },
        React.createElement(LoadingSpinner, { className: 'w-8 h-8 animate-spin text-indigo-400' }),
        React.createElement('p', { className: 'mt-2 text-gray-400' }, agent.details || 'Processing...')
      ),
      agent.output && React.createElement('p', { className: 'whitespace-pre-wrap' }, agent.output),
      agent.status === 'error' && React.createElement('p', { className: 'text-red-500' }, agent.output || 'An unknown error occurred.')
    )
  );
};