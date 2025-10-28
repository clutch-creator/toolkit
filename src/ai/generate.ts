import type { LanguageModel, ToolSet, UIMessage } from 'ai';
import {
  convertToModelMessages,
  generateText,
  stepCountIs,
  streamText,
  tool,
} from 'ai';
import { z } from 'zod';

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

export async function generateObject<T extends z.ZodType>({
  model,
  system,
  tools,
  schema,
  prompt,
}: {
  model: LanguageModel;
  system: string;
  tools?: ToolSet;
  schema: T;
  prompt: string;
}): Promise<z.infer<T>> {
  const result = await generateText({
    model,
    prompt,
    system: `${system}

CRITICAL INSTRUCTION: You MUST call the 'output' tool at the end of your response. This is mandatory and non-negotiable. Always end by calling the 'output' tool with the structured data requested.

DO NOT generate any text output. ONLY use tool calls. Do not explain, describe, or write anything. Just call the necessary tools.`,
    tools: {
      ...tools,
      output: tool({
        description:
          'REQUIRED: Call this tool to return the final structured output. You MUST call this tool.',
        inputSchema: schema,
        execute: async args => args,
      }),
    },
    toolChoice: 'required',
  });

  const outputToolCall = result.toolResults.find(
    call => call.toolName === 'output'
  );

  if (!outputToolCall) {
    throw new Error('No output tool call found');
  }

  return outputToolCall.output as z.infer<T>;
}
