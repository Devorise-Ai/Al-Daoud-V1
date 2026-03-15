import { env } from '../config/env';

// Hugging Face Inference API (OpenAI-compatible endpoint)
// Supports chat completions with tool-use
const HF_API_URL = 'https://router.huggingface.co/v1';

interface HFMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

interface HFToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface HFChoice {
  message: {
    role: string;
    content: string | null;
    tool_calls?: HFToolCall[];
  };
  finish_reason: string;
}

interface HFResponse {
  choices: HFChoice[];
}

interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export async function chatCompletion(
  messages: HFMessage[],
  tools?: ToolDefinition[],
  options?: { temperature?: number; max_tokens?: number }
): Promise<HFChoice> {
  const body: Record<string, any> = {
    model: 'Qwen/Qwen2.5-72B-Instruct',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens ?? 1024,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const response = await fetch(HF_API_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.hfApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HuggingFace API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as HFResponse;

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from HuggingFace API');
  }

  return data.choices[0];
}

export type { HFMessage, HFToolCall, HFChoice, ToolDefinition };
