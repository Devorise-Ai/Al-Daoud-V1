// c:\Users\DELL\Desktop\Court aldaoud agent\apps\api\debug_openai.ts
import { processMessage } from './src/ai/agent';
import { getConversation } from './src/ai/conversation';

async function run() {
  const phone = '+962791000001';
  console.log('Fetching initial conversation...');
  const conv = await getConversation(phone);
  console.log('Initial messages count:', conv.messages.length);
  
  try {
    console.log('Sending message 1...');
    await processMessage(phone, 'What are my upcoming bookings?');
    console.log('Success!');
  } catch (e: any) {
    console.error('Error on message 1:', e.message);
  }

  try {
    console.log('Sending message 2...');
    await processMessage(phone, 'I want to cancel my last booking.');
    console.log('Success!');
  } catch (e: any) {
    console.error('Error on message 2:', e.message);
  }
}

run();
