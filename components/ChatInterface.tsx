import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import type { ChatMessage, ChatMode } from '../types';
import { InputForm } from './InputForm';
import { BoltIcon, BrainIcon, ChatIcon, GlobeIcon, LoadingSpinner } from './icons';
import type { Chat } from '@google/genai';

const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<ChatMode>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const getModelForMode = (chatMode: ChatMode) => {
    switch (chatMode) {
      case 'fast':
        return 'gemini-flash-lite-latest';
      case 'deepThought':
      case 'grounded':
      case 'standard':
      default:
        return 'gemini-2.5-flash';
    }
  };
  
  // Reset chat session when mode changes
  useEffect(() => {
    const model = getModelForMode(mode);
    if (mode === 'standard' || mode === 'fast') {
      chatSessionRef.current = geminiService.startChat(model);
    } else {
      chatSessionRef.current = null;
    }
    setMessages([]); // Clear messages when mode changes
  }, [mode]);


  const handleSubmit = async (prompt: string) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (mode === 'standard' || mode === 'fast') {
        if (!chatSessionRef.current) {
            chatSessionRef.current = geminiService.startChat(getModelForMode(mode));
        }
        setMessages(prev => [...prev, { role: 'model', content: '' }]);
        const stream = await geminiService.streamChat(chatSessionRef.current, prompt);
        let fullResponse = '';

        for await (const chunk of stream) {
          fullResponse += chunk.text;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {...newMessages[newMessages.length - 1], content: fullResponse};
            return newMessages;
          });
        }
      } else if (mode === 'grounded') {
        const { text, sources } = await geminiService.groundedQuery(prompt);
        const modelMessage: ChatMessage = { role: 'model', content: text, sources };
        setMessages(prev => [...prev, modelMessage]);
      } else if (mode === 'deepThought') {
        const text = await geminiService.deepThoughtQuery(prompt);
        const modelMessage: ChatMessage = { role: 'model', content: text };
        setMessages(prev => [...prev, modelMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = { role: 'model', content: 'Sorry, an error occurred. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const ModeButton = ({ chatMode, label, icon: Icon }) => (
      React.createElement('button', {
          onClick: () => setMode(chatMode),
          className: `flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${mode === chatMode ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`,
          disabled: isLoading
      }, React.createElement(Icon, {className: "w-4 h-4"}), React.createElement('span', null, label))
  );

  const renderMessageContent = (msg: ChatMessage) => {
    const children = [React.createElement('p', { key: 'content', className: 'whitespace-pre-wrap' }, msg.content)];
    if (msg.sources && msg.sources.length > 0) {
      const sourceListItems = msg.sources.map((source, i) => (
        React.createElement('li', { key: i },
          React.createElement('a', { href: source.url, target: '_blank', rel: 'noopener noreferrer', className: 'text-sky-400 text-xs hover:underline truncate' }, source.title)
        )
      ));
      children.push(
        React.createElement('div', { key: 'sources', className: 'mt-3 border-t border-slate-600 pt-2' },
          React.createElement('h4', { className: 'text-xs font-bold text-slate-400 mb-1' }, 'Sources:'),
          React.createElement('ul', { className: 'space-y-1' }, ...sourceListItems)
        )
      );
    }
    return children;
  };

  const chatMessagesElements = messages.map((msg, index) => (
    React.createElement('div', { key: index, className: `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}` },
      React.createElement('div', { className: `max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}` },
        ...renderMessageContent(msg)
      )
    )
  ));
  
  if (isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user') {
    chatMessagesElements.push(
      React.createElement('div', { key: messages.length, className: 'flex justify-start' },
        React.createElement('div', { className: 'max-w-lg p-3 rounded-lg bg-slate-700 text-slate-200' },
          React.createElement(LoadingSpinner, { className: 'w-6 h-6 animate-spin text-indigo-400' })
        )
      )
    );
  }

  return React.createElement('div', { className: 'w-full max-w-3xl mx-auto' },
    React.createElement('div', { className: 'bg-slate-900/70 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl flex flex-col h-[70vh]' },
      React.createElement('div', { className: 'p-4 border-b border-slate-700 flex items-center justify-center space-x-2' },
        React.createElement(ModeButton, { chatMode: 'standard', label: 'Standard', icon: ChatIcon }),
        React.createElement(ModeButton, { chatMode: 'fast', label: 'Fast', icon: BoltIcon }),
        React.createElement(ModeButton, { chatMode: 'grounded', label: 'Grounded', icon: GlobeIcon }),
        React.createElement(ModeButton, { chatMode: 'deepThought', label: 'Deep Thought', icon: BrainIcon })
      ),
      React.createElement('div', { className: 'flex-grow p-4 overflow-y-auto space-y-4' },
        ...chatMessagesElements,
        React.createElement('div', { ref: messagesEndRef })
      ),
      React.createElement('div', { className: 'p-4 border-t border-slate-700' },
        React.createElement(InputForm, { onSubmit: handleSubmit, isLoading: isLoading, placeholder: 'Type your message...', buttonText: 'Send' })
      )
    )
  );
};

export default ChatInterface;
