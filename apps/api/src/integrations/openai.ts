import { env } from '../config/env';

const OPENAI_API_URL = 'https://api.openai.com/v1';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface Choice {
  message: ChatMessage;
  finish_reason: string;
}

interface ChatResponse {
  choices: Choice[];
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
  messages: ChatMessage[],
  tools?: ToolDefinition[],
  options?: { temperature?: number; max_tokens?: number }
): Promise<Choice> {
  const body: Record<string, any> = {
    model: 'gpt-4o-mini',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens ?? 1024,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const response = await fetch(OPENAI_API_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as ChatResponse;

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from OpenAI API');
  }

  return data.choices[0];
}

export type { ChatMessage, ToolCall, Choice, ToolDefinition };
