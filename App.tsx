import React, { useState, useCallback } from 'react';
import { AgentCard } from './components/AgentCard';
import { InputForm } from './components/InputForm';
import { ResultDisplay } from './components/ResultDisplay';
import ChatInterface from './components/ChatInterface';
import { MeteorIcon, GitHubIcon } from './components/icons';
import { geminiService } from './services/geminiService';
import type { Agent, FinalResponse, AgentMode } from './types';

const initialAgents: Agent[] = [
  { name: 'Agent₁', role: 'Request Interpreter', status: 'idle', output: null },
  { name: 'Agent₂', role: 'Context Refiner & Keyword Extractor', status: 'idle', output: null },
  { name: 'Agent₃', role: 'Tool Specialist (Image & Web Search)', status: 'idle', output: null },
  { name: 'Agent₄', role: 'Data Aggregator & Synthesizer', status: 'idle', output: null },
];

const animationStyles = `
body {
    background-color: #020617; /* slate-950 */
    overflow-x: hidden;
}
@keyframes move-stars-1 {
  from { transform: translate(0, 0); }
  to { transform: translate(-20px, -2000px); }
}
@keyframes move-stars-2 {
  from { transform: translate(0, 0); }
  to { transform: translate(30px, -2000px); }
}
@keyframes move-stars-3 {
  from { transform: translate(0, 0); }
  to { transform: translate(-10px, -2000px); }
}
.stars {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 2000px; /* This needs to be tall enough for the animation */
}
.stars1 {
    background-image: radial-gradient(1px 1px at 50px 100px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 150px 200px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 200px 50px, #fff, rgba(0,0,0,0));
    background-size: 400px 400px;
    animation: move-stars-1 200s linear infinite;
}
.stars2 {
    background-image: radial-gradient(2px 2px at 10px 40px, #eee, rgba(0,0,0,0)), radial-gradient(2px 2px at 80px 120px, #fff, rgba(0,0,0,0)), radial-gradient(3px 3px at 160px 220px, #ddd, rgba(0,0,0,0));
    background-size: 300px 300px;
    animation: move-stars-2 120s linear infinite;
}
.stars3 {
    background-image: radial-gradient(2px 2px at 60px 80px, #fff, rgba(0,0,0,0)), radial-gradient(3px 3px at 120px 180px, #fff, rgba(0,0,0,0)), radial-gradient(3px 3px at 200px 250px, #fff, rgba(0,0,0,0));
    background-size: 200px 200px;
    animation: move-stars-3 60s linear infinite;
}
`;

const formatErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message) {
        if (error.message.includes('503') || error.message.toLowerCase().includes('overloaded')) {
            return 'The AI model is currently experiencing high traffic and is temporarily unavailable. Please try again in a few moments.';
        }
        return error.message;
    }
    return 'An unknown error occurred.';
};

const App = () => {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [finalResponse, setFinalResponse] = useState<FinalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'agent' | 'chat'>('agent');
  const [agentMode, setAgentMode] = useState<AgentMode>('quality');
  const [lastPrompt, setLastPrompt] = useState('');

  const updateAgent = useCallback((agentName: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.name === agentName ? { ...a, ...updates } : a));
  }, []);

  const resetState = () => {
    setAgents(initialAgents);
    setFinalResponse(null);
    setIsLoading(false);
    setError(null);
  };

  const handleSubmit = async (prompt: string) => {
    resetState();
    setIsLoading(true);
    setLastPrompt(prompt);

    try {
      // Agent 1: Interpret Request
      updateAgent('Agent₁', { status: 'thinking', details: 'Interpreting user request...' });
      const interpretation = await geminiService.interpretRequest(prompt);
      updateAgent('Agent₁', { status: 'done', output: interpretation });
      let currentContext = interpretation;

      // Agent 2: Reason and Structure in a loop
      const refinementLoops = agentMode === 'fast' ? 1 : 3;
      let structuredData;
      for (let i = 1; i <= refinementLoops; i++) {
        updateAgent('Agent₂', { status: 'refining', details: `Refining context & extracting keywords (Loop ${i}/${refinementLoops})...` });
        structuredData = await geminiService.reasonAndStructure(currentContext, i, agentMode);
        currentContext = structuredData.text; // Use refined text for next iteration
        updateAgent('Agent₂', { output: JSON.stringify(structuredData, null, 2) });
      }
      updateAgent('Agent₂', { status: 'done' });

      // Agent 3: Call Tools
      updateAgent('Agent₃', { status: 'calling_tools', details: 'Generating image and searching web...' });
      const { image, news, paper, video } = structuredData;
      
      const [imageResult, newsResults, paperResults, videoResults] = await Promise.all([
        geminiService.generateImage(image),
        geminiService.searchWeb(news, 'news articles'),
        geminiService.searchWeb(paper, 'research papers'),
        geminiService.searchWeb(video, 'videos'),
      ]);
      
      const finalImageUrl = imageResult;
      const toolOutput = `Image Prompt: ${image}\nNews Query: ${news}\nPaper Query: ${paper}\nVideo Query: ${video}`;

      updateAgent('Agent₃', { status: 'done', output: toolOutput });

      const contextData = { news: newsResults, papers: paperResults, videos: videoResults };

      // Agent 4: Aggregate Response
      updateAgent('Agent₄', { status: 'thinking', details: 'Synthesizing final response...' });
      const finalSummary = await geminiService.aggregateResponse(prompt, contextData, agentMode);
      updateAgent('Agent₄', { status: 'done', output: finalSummary });

      setFinalResponse({
        text: finalSummary,
        imageUrl: finalImageUrl,
        news: newsResults,
        papers: paperResults,
        videos: videoResults,
      });

    } catch (err) {
        const errorMessage = formatErrorMessage(err);
        setError(errorMessage);
        console.error(err);

        // Find the first agent that is not 'done' and set its status to 'error'
        setAgents(prev => {
            const newAgents = [...prev];
            const errorAgentIndex = newAgents.findIndex(a => a.status !== 'done' && a.status !== 'idle');
            if (errorAgentIndex !== -1) {
                newAgents[errorAgentIndex].status = 'error';
                newAgents[errorAgentIndex].output = errorMessage;
            }
            return newAgents;
        });

    } finally {
      setIsLoading(false);
    }
  };

  const AgentModeToggle = () => (
    React.createElement('div', { className: 'flex justify-center my-4' },
      React.createElement('div', { className: 'bg-slate-800/60 border border-slate-700 p-1 rounded-lg' },
        React.createElement('button', {
          onClick: () => setAgentMode('quality'),
          disabled: isLoading,
          className: `px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${agentMode === 'quality' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-700 disabled:opacity-50'}`
        }, 'Quality Mode'),
        React.createElement('button', {
          onClick: () => setAgentMode('fast'),
          disabled: isLoading,
          className: `px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${agentMode === 'fast' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-700 disabled:opacity-50'}`
        }, 'Fast Mode')
      )
    )
  );

  return React.createElement('div', { className: 'min-h-screen text-white font-sans flex flex-col' },
    React.createElement('style', null, animationStyles),
    React.createElement('div', { className: 'stars stars1' }),
    React.createElement('div', { className: 'stars stars2' }),
    React.createElement('div', { className: 'stars stars3' }),
    React.createElement('main', { className: 'container mx-auto px-4 py-8 relative z-10 flex-grow' },
      React.createElement('header', { className: 'text-center mb-8 animate-fade-in' },
        React.createElement(MeteorIcon, { className: 'w-16 h-16 mx-auto mb-4 text-indigo-400' }),
        React.createElement('h1', { className: 'text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 to-indigo-500 text-transparent bg-clip-text' }, 'Multi-Agent AI Explorer'),
        React.createElement('p', { className: 'mt-3 text-lg text-slate-400 max-w-3xl mx-auto' }, 'An advanced AI system demonstrating a collaborative multi-agent workflow for complex request fulfillment and interactive chat.')
      ),
      
      // View switcher
      React.createElement('div', { className: 'flex justify-center mb-8' },
        React.createElement('div', { className: 'bg-slate-800/60 border border-slate-700 p-1 rounded-lg' },
          React.createElement('button', {
            onClick: () => setView('agent'),
            className: `px-4 py-2 rounded-md transition-colors text-sm font-medium ${view === 'agent' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`
          }, 'Agent Workflow'),
          React.createElement('button', {
            onClick: () => setView('chat'),
            className: `px-4 py-2 rounded-md transition-colors text-sm font-medium ${view === 'chat' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`
          }, 'Chat Interface')
        )
      ),

      view === 'agent' ?
        React.createElement('div', null,
          React.createElement(AgentModeToggle, null),
          React.createElement(InputForm, { onSubmit: handleSubmit, isLoading: isLoading, placeholder: 'Describe a complex topic or request...', buttonText: null }),
          error && !isLoading && React.createElement('div', { className: 'text-center mt-4' },
            React.createElement('button', {
              onClick: () => handleSubmit(lastPrompt),
              className: 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300'
            }, 'Retry Last Request')
          ),
          React.createElement('div', { className: 'mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' },
            ...agents.map(agent => React.createElement(AgentCard, { key: agent.name, agent: agent }))
          ),
          finalResponse && React.createElement(ResultDisplay, { response: finalResponse })
        )
        :
        React.createElement(ChatInterface, null)
    ),
    React.createElement('footer', { className: 'relative z-10 text-center py-4 mt-auto text-slate-500 text-sm border-t border-slate-800/50' },
        React.createElement('p', { className: 'mb-1' }, 'Developed by Krishna Karra'),
        React.createElement('a', { 
            href: 'https://github.com/krishna684/gemini_bot', 
            target: '_blank', 
            rel: 'noopener noreferrer', 
            className: 'inline-flex items-center gap-2 hover:text-slate-300 transition-colors' 
        },
            React.createElement(GitHubIcon, { className: 'w-4 h-4' }),
            'View on GitHub'
        )
    )
  );
};

export default App;
