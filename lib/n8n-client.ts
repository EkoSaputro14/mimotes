/**
 * n8n Webhook Client for MimoNotes
 * 
 * This module provides functions to call n8n workflows via webhooks.
 * It replaces the direct RAG/OCR processing in Next.js with n8n workflows.
 */

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

interface N8NResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Call an n8n webhook
 */
async function callN8NWebhook<T = any>(
  workflow: string,
  payload: Record<string, any>
): Promise<N8NResponse<T>> {
  try {
    const url = `${N8N_WEBHOOK_URL}/${workflow}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (N8N_API_KEY) {
      headers['X-N8N-API-KEY'] = N8N_API_KEY;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`n8n webhook error [${workflow}]:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Chat with RAG via n8n
 */
export async function chatWithRAG(params: {
  message: string;
  sessionId?: string;
  mode?: string;
  workspaceId: string;
  userId: string;
  aiBaseUrl?: string;
  aiApiKey?: string;
  aiModel?: string;
  embeddingModel?: string;
}): Promise<N8NResponse> {
  return callN8NWebhook('mimotes-chat', params);
}

/**
 * Process document upload via n8n
 */
export async function processDocumentUpload(params: {
  documentId: string;
  fileUrl: string;
  fileType?: string;
  workspaceId: string;
  userId: string;
  aiBaseUrl?: string;
  aiApiKey?: string;
  embeddingModel?: string;
}): Promise<N8NResponse> {
  return callN8NWebhook('mimotes-upload', params);
}

/**
 * Search knowledge base via n8n
 */
export async function searchKnowledge(params: {
  query: string;
  topK?: number;
  threshold?: number;
  workspaceId: string;
  documentId?: string;
  aiBaseUrl?: string;
  aiApiKey?: string;
  embeddingModel?: string;
}): Promise<N8NResponse> {
  return callN8NWebhook('mimotes-search', params);
}

/**
 * Process image OCR via n8n
 */
export async function processImageOCR(params: {
  imageUrl: string;
  documentId: string;
  workspaceId: string;
  aiBaseUrl?: string;
  aiApiKey?: string;
  visionModel?: string;
}): Promise<N8NResponse> {
  return callN8NWebhook('mimotes-ocr', params);
}

/**
 * Stream chat response via n8n (for real-time streaming)
 */
export async function streamChatResponse(
  params: {
    message: string;
    sessionId?: string;
    mode?: string;
    workspaceId: string;
    userId: string;
    aiBaseUrl?: string;
    aiApiKey?: string;
    aiModel?: string;
    embeddingModel?: string;
  },
  onChunk: (chunk: string) => void,
  onDone: (sources: any[]) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const url = `${N8N_WEBHOOK_URL}/mimotes-chat`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (N8N_API_KEY) {
      headers['X-N8N-API-KEY'] = N8N_API_KEY;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }
    
    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }
    
    const decoder = new TextDecoder();
    let sources: any[] = [];
    
    // Extract sources from headers
    const sourcesHeader = response.headers.get('X-Sources');
    if (sourcesHeader) {
      try {
        sources = JSON.parse(decodeURIComponent(sourcesHeader));
      } catch {
        // Ignore parse errors
      }
    }
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
    
    onDone(sources);
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

export default {
  chatWithRAG,
  processDocumentUpload,
  searchKnowledge,
  processImageOCR,
  streamChatResponse,
};
