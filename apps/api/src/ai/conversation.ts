import { redis } from '../config/redis';
import { query } from '../config/database';
import { ChatMessage } from '../integrations/openai';

const CONVERSATION_TTL = 7200; // 2 hours
const KEY_PREFIX = 'conv:';

export interface ConversationState {
  id: string;
  customerPhone: string;
  lang: 'ar' | 'en';
  messages: ChatMessage[];
  startedAt: string;
}

// Get or create conversation for a phone number
export async function getConversation(customerPhone: string): Promise<ConversationState> {
  const key = KEY_PREFIX + customerPhone;

  try {
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Redis might not be connected, fall back to in-memory
  }

  // Check customer's preferred language
  let lang: 'ar' | 'en' = 'ar';
  try {
    const customer = await query('SELECT preferred_lang FROM customers WHERE phone = $1', [customerPhone]);
    if (customer.rows.length > 0) {
      lang = customer.rows[0].preferred_lang || 'ar';
    }
  } catch {
    // DB might not be connected during testing
  }

  const conversation: ConversationState = {
    id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    customerPhone,
    lang,
    messages: [],
    startedAt: new Date().toISOString(),
  };

  return conversation;
}

// Save conversation state
export async function saveConversation(state: ConversationState): Promise<void> {
  const key = KEY_PREFIX + state.customerPhone;

  try {
    await redis.set(key, JSON.stringify(state), { EX: CONVERSATION_TTL });
  } catch {
    // Redis not connected — conversation will be lost on next message
    // This is acceptable for development
  }
}

// Add a message to conversation
export function addMessage(state: ConversationState, message: ChatMessage): void {
  state.messages.push(message);

  // Keep only last 20 messages to prevent context overflow
  if (state.messages.length > 20) {
    // Keep system message (first) + last 19
    const system = state.messages.find(m => m.role === 'system');
    state.messages = state.messages.slice(-19);
    if (system) {
      state.messages.unshift(system);
    }
  }
}

// End conversation and save to database
export async function endConversation(state: ConversationState, intent?: string): Promise<void> {
  const key = KEY_PREFIX + state.customerPhone;

  // Save to conversations table
  try {
    const customerResult = await query('SELECT id FROM customers WHERE phone = $1', [state.customerPhone]);
    const customerId = customerResult.rows.length > 0 ? customerResult.rows[0].id : null;

    await query(
      `INSERT INTO conversations (customer_id, channel, status, messages, intent, resolved, started_at, ended_at)
       VALUES ($1, 'whatsapp', 'completed', $2, $3, true, $4, NOW())`,
      [customerId, JSON.stringify(state.messages), intent || null, state.startedAt]
    );
  } catch (err) {
    console.error('Failed to save conversation to DB:', err);
  }

  // Remove from Redis
  try {
    await redis.del(key);
  } catch {
    // Redis not connected
  }
}

// Detect language from message text
export function detectLanguage(text: string): 'ar' | 'en' {
  // Simple heuristic: check for Arabic characters
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicRegex.test(text) ? 'ar' : 'en';
}
