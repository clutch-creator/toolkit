import { convertToModelMessages, stepCountIs, streamText } from 'ai';

export async function streamUIResponse({ model, system, messages, tools }) {
  const result = streamText({
    model,
    system,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(15),
    maxOutputTokens: 2000,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
