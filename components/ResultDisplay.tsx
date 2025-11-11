import React from 'react';
import { NewsIcon, PaperIcon, VideoIcon } from './icons.tsx';
import type { FinalResponse, SearchResult } from '../types.ts';

export const ResultDisplay = ({ response }: { response: FinalResponse | null }) => {
  if (!response) {
    return null;
  }
  const renderLinkList = (items: SearchResult[], Icon: React.ElementType) => (
    React.createElement('ul', { className: 'space-y-2' },
      items.map((item, index) => (
        React.createElement('li', { key: index, className: 'flex items-start' },
          React.createElement(Icon, { className: 'w-5 h-5 mr-3 mt-1 text-sky-400 flex-shrink-0' }),
          React.createElement('a', { href: item.url, target: '_blank', rel: 'noopener noreferrer', className: 'text-sky-400 hover:underline hover:text-sky-300 transition-colors' }, item.title)
        )
      ))
    )
  );
  return React.createElement('div', { className: 'mt-8 w-full max-w-4xl mx-auto bg-slate-900/70 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in' },
    React.createElement('div', { className: 'p-6' },
      React.createElement('h2', { className: 'text-2xl font-bold text-white mb-4' }, 'Aggregated Response'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
        React.createElement('div', { className: 'md:col-span-2' },
          React.createElement('p', { className: 'text-slate-300 leading-relaxed' }, response.text),
          React.createElement('div', { className: 'mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6' },
            React.createElement('div', null,
              React.createElement('h4', { className: 'text-lg font-semibold text-white mb-3' }, 'News Articles'),
              renderLinkList(response.news, NewsIcon)
            ),
            React.createElement('div', null,
              React.createElement('h4', { className: 'text-lg font-semibold text-white mb-3' }, 'Research Papers'),
              renderLinkList(response.papers, PaperIcon)
            ),
            React.createElement('div', { className: 'lg:col-span-2' },
              React.createElement('h4', { className: 'text-lg font-semibold text-white mb-3' }, 'Videos'),
              renderLinkList(response.videos, VideoIcon)
            )
          )
        ),
        React.createElement('div', { className: 'md:col-span-1' },
          React.createElement('img', {
            src: response.imageUrl,
            alt: 'Generated visual representation',
            className: 'w-full h-auto object-cover rounded-lg shadow-md border-2 border-slate-700'
          })
        )
      )
    )
  );
};