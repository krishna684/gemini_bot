export type AgentStatus = 'idle' | 'thinking' | 'refining' | 'calling_tools' | 'done' | 'error';

export interface Agent {
  name: string;
  role: string;
  status: AgentStatus;
  output: string | null;
  details?: string;
}

export interface SearchResult {
    title: string;
    url: string;
}

export interface FinalResponse {
    text: string;
    imageUrl: string;
    news: SearchResult[];
    papers: SearchResult[];
    videos: SearchResult[];
}

// New types for Chat
export type ChatMode = 'standard' | 'fast' | 'grounded' | 'deepThought';
export type AgentMode = 'quality' | 'fast';

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    sources?: SearchResult[];
}