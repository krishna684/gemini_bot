import { GoogleGenAI, Chat, Type, Modality } from '@google/genai';
import type { SearchResult, AgentMode } from '../types';

// According to guidelines, initialize with object
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function interpretRequest(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Interpret this user request and rephrase it as a clear, actionable instruction for an AI system. Focus on the core intent. Request: "${prompt}"`,
  });
  return response.text.trim();
}

async function reasonAndStructure(context: string, loop: number, mode: AgentMode): Promise<{ image: string; news: string; paper: string; video: string; text: string; }> {
  const model = 'gemini-2.5-flash'; // Always use flash model
  const response = await ai.models.generateContent({
    model: model,
    contents: `You are an AI agent that refines a user request into structured data.
      Current context: "${context}"
      Iteration: ${loop}/${mode === 'fast' ? 1 : 3}
      Based on the context, generate:
      1. A refined, more detailed text description of the core topic.
      2. A concise image generation prompt (e.g., for Imagen or DALL-E) for a relevant image.
      3. A search query for finding recent news articles.
      4. A search query for finding relevant scientific/research papers.
      5. A search query for finding relevant videos.
      
      Return ONLY a JSON object with keys: "text", "image", "news", "paper", "video".`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
          type: Type.OBJECT,
          properties: {
              text: { type: Type.STRING, description: 'Refined context text.' },
              image: { type: Type.STRING, description: 'Image generation prompt.' },
              news: { type: Type.STRING, description: 'News search query.' },
              paper: { type: Type.STRING, description: 'Research paper search query.' },
              video: { type: Type.STRING, description: 'Video search query.' },
          },
          required: ['text', 'image', 'news', 'paper', 'video'],
      },
    },
  });

  const jsonText = response.text.trim();
  try {
      const parsed = JSON.parse(jsonText);
      return parsed;
  } catch (e) {
      console.error("Failed to parse JSON from reasonAndStructure:", jsonText, e);
      throw new Error("AI failed to return valid structured data for reasoning step.");
  }
}

async function generateImage(prompt: string): Promise<string> {
  const imagePrompt = prompt && prompt.trim().length > 10 ? prompt : "abstract representation of artificial intelligence in space";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: imagePrompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error("Image generation succeeded but returned no image data.");

  } catch (e) {
    console.error("Image generation failed:", e);
    // Re-throw other errors to be handled by the UI layer
    throw e;
  }
}

async function searchWeb(query: string, type: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 3) {
      return [];
  }
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find relevant ${type} about: "${query}"`,
        config: {
            tools: [{googleSearch: {}}],
        },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (groundingChunks) {
        return groundingChunks
            .filter(chunk => chunk.web && chunk.web.uri && chunk.web.title)
            .map(chunk => ({
                title: chunk.web.title,
                url: chunk.web.uri,
            }))
            .slice(0, 5);
    }
    // Return empty array if no chunks, this is not an error
    return [];
  } catch (e) {
      console.error(`Web search failed for query "${query}":`, e);
      // Re-throw the error to be handled by the UI layer
      throw e;
  }
}


async function aggregateResponse(prompt: string, contextData: { news: SearchResult[]; papers: SearchResult[]; videos: SearchResult[]; }, mode: AgentMode): Promise<string> {
  const model = 'gemini-2.5-flash'; // Always use flash model
  const contextString = `
    User's original request: "${prompt}"
    
    You have gathered the following information:
    - News Articles Titles: ${JSON.stringify(contextData.news.map(n => n.title))}
    - Research Papers Titles: ${JSON.stringify(contextData.papers.map(p => p.title))}
    - Videos Titles: ${JSON.stringify(contextData.videos.map(v => v.title))}
    
    Based on all the information gathered, synthesize a comprehensive, well-structured, and easy-to-read final answer to the user's original request. Address the user directly. Format the response using markdown. Do not simply list the sources; integrate the information into a cohesive answer.
  `;
  
  const response = await ai.models.generateContent({
    model: model,
    contents: contextString,
  });
  
  return response.text.trim();
}

function startChat(model: string): Chat {
  return ai.chats.create({
    model: model,
  });
}

async function streamChat(chatSession: Chat, prompt: string) {
  return chatSession.sendMessageStream({ message: prompt });
}

async function groundedQuery(prompt: string): Promise<{ text: string; sources: SearchResult[] }> {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
          tools: [{googleSearch: {}}],
      },
    });

    const text = response.text.trim();
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let sources: SearchResult[] = [];

    if (groundingChunks) {
        sources = groundingChunks
          .filter(chunk => chunk.web && chunk.web.uri && chunk.web.title)
          .map(chunk => ({
              title: chunk.web.title,
              url: chunk.web.uri,
          }));
    }

    return { text, sources };
}

async function deepThoughtQuery(prompt: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 24576 }, // Max for flash model
        }
    });
    return response.text.trim();
}

export const geminiService = {
  interpretRequest,
  reasonAndStructure,
  generateImage,
  searchWeb,
  aggregateResponse,
  startChat,
  streamChat,
  groundedQuery,
  deepThoughtQuery,
};
