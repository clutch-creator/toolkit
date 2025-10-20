import type { LanguageModel, ToolSet, UIMessage } from 'ai';
import { convertToModelMessages, stepCountIs, streamText } from 'ai';

export async function streamUIResponse({
  model,
  system,
  messages,
  tools,
}: {
  model: LanguageModel;
  system: string;
  messages: UIMessage[];
  tools?: ToolSet;
}) {
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
