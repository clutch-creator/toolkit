import type { LanguageModel, ToolSet, UIMessage } from 'ai';
import {
  convertToModelMessages,
  generateText,
  hasToolCall,
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
  maxSteps = 20,
}: {
  model: LanguageModel;
  system: string;
  messages: UIMessage[];
  tools?: ToolSet;
  maxSteps?: number;
}) {
  const result = streamText({
    model,
    system,
    messages: convertToModelMessages(messages),
    tools: {
      ...tools,
      internal_answered: tool({
        description: 'Internal tool to mark that the AI has answered the user.',
        inputSchema: z.object({}),
        execute: async () => null,
      }),
    },
    stopWhen: [stepCountIs(maxSteps), hasToolCall('internal_answered')],
  });

  return result.toUIMessageStreamResponse();
}

export async function generateObject<T extends z.ZodType>({
  model,
  system,
  tools,
  schema,
  prompt = 'Call the final_output tool to return the structured data as per the tool schema.',
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

CRITICAL INSTRUCTION: You must call the 'final_output' tool exactly once with the requested data. Only use tools, no text responses.`,
    tools: {
      ...tools,
      final_output: tool({
        description:
          'REQUIRED: Call this tool to return the final structured output. You MUST call this tool.',
        inputSchema: schema,
        execute: async args => args,
      }),
    },
    stopWhen: hasToolCall('final_output'),
  });

  const allToolCalls = result.steps.flatMap(step => step.toolCalls);
  const outputToolCall = allToolCalls.find(
    call => call.toolName === 'final_output'
  );

  if (!outputToolCall) {
    throw new Error('No output tool call found');
  }

  return outputToolCall.input;
}
