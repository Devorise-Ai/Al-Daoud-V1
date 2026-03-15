import { chatCompletion, ChatMessage } from '../integrations/openai';
import { toolDefinitions, executeTool } from './tools';
import { getSystemPrompt } from './prompts';
import {
  getConversation,
  saveConversation,
  addMessage,
  detectLanguage,
  ConversationState,
} from './conversation';

const MAX_TOOL_ROUNDS = 10; // Max tool call rounds per message to prevent infinite loops

export interface AgentResponse {
  reply: string;
  toolsCalled: string[];
  conversationId: string;
  lang: 'ar' | 'en';
}

/**
 * Main entry point: process an incoming message from a customer.
 * Manages conversation state, calls the AI model, executes tools, and returns a reply.
 */
export async function processMessage(
  customerPhone: string,
  messageText: string
): Promise<AgentResponse> {
  // 1. Get or create conversation state
  const conversation = await getConversation(customerPhone);

  // 2. Detect language from first message
  if (conversation.messages.length === 0) {
    conversation.lang = detectLanguage(messageText);
  }

  // 3. Ensure system prompt is the first message
  if (!conversation.messages.find(m => m.role === 'system')) {
    addMessage(conversation, {
      role: 'system',
      content: getSystemPrompt(conversation.lang),
    });
  }

  // 4. Add the customer's message
  addMessage(conversation, {
    role: 'user',
    content: messageText,
  });

  // 5. Run the AI conversation loop (model may call tools multiple times)
  const toolsCalled: string[] = [];
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    // Call the AI model
    const response = await chatCompletion(
      conversation.messages,
      toolDefinitions,
      { temperature: 0.7, max_tokens: 1024 }
    );

    // If model wants to call tools
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      // Add the assistant's tool-call message to history (include tool_calls for OpenAI)
      addMessage(conversation, {
        role: 'assistant',
        content: response.message.content || null,
        tool_calls: response.message.tool_calls,
      });

      // Execute each tool and add results
      for (const toolCall of response.message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[AI Agent] Calling tool: ${toolName}`, toolArgs);
        toolsCalled.push(toolName);

        const toolResult = await executeTool(toolName, toolArgs);

        addMessage(conversation, {
          role: 'tool',
          content: toolResult,
          tool_call_id: toolCall.id,
        });
      }

      // Continue the loop — model will process tool results
      continue;
    }

    // Model returned a text response (no more tool calls)
    const reply = response.message.content || getDefaultReply(conversation.lang);

    addMessage(conversation, {
      role: 'assistant',
      content: reply,
    });

    // Save conversation state
    await saveConversation(conversation);

    return {
      reply,
      toolsCalled,
      conversationId: conversation.id,
      lang: conversation.lang,
    };
  }

  // If we exceeded max tool rounds, return a fallback message
  const fallback = conversation.lang === 'ar'
    ? 'عذراً، واجهت مشكلة في معالجة طلبك. يرجى المحاولة مرة أخرى أو التواصل مع الإدارة.'
    : 'Sorry, I encountered an issue processing your request. Please try again or contact management.';

  await saveConversation(conversation);

  return {
    reply: fallback,
    toolsCalled,
    conversationId: conversation.id,
    lang: conversation.lang,
  };
}

/**
 * Process a message without persistent state (for testing).
 */
export async function processTestMessage(
  messageText: string,
  lang: 'ar' | 'en' = 'ar'
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: getSystemPrompt(lang) },
    { role: 'user', content: messageText },
  ];

  const response = await chatCompletion(messages, toolDefinitions, {
    temperature: 0.7,
    max_tokens: 1024,
  });

  return response.message.content || getDefaultReply(lang);
}

function getDefaultReply(lang: 'ar' | 'en'): string {
  return lang === 'ar'
    ? 'أهلاً وسهلاً بملاعب الداعود! كيف بقدر أساعدك؟'
    : 'Welcome to Al Daoud Football Courts! How can I help you?';
}
