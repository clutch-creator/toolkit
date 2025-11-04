import type { LanguageModel, ToolSet, UIMessage } from 'ai';
import {
  generateText as aiGenerateText,
  convertToModelMessages,
  hasToolCall,
  stepCountIs,
  streamText,
  tool,
} from 'ai';
import { z } from 'zod';

/**
 * Streams a UI response using the AI model with the provided messages and tools.
 * Automatically stops when max steps is reached or when the internal_answered tool is called.
 */
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

/**
 * Generates a structured object that conforms to the provided Zod schema.
 * Forces the model to call the final_output tool to return properly typed data.
 */
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
  const result = await aiGenerateText({
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

/**
 * Generates a text response using the AI model with optional tools.
 * Returns the generated text as a string.
 */
export async function generateText({
  model,
  prompt,
  system,
  tools,
  maxSteps = 20,
}: {
  model: LanguageModel;
  prompt: string;
  system: string;
  tools?: ToolSet;
  maxSteps?: number;
}): Promise<string> {
  const result = await aiGenerateText({
    model,
    prompt,
    system,
    tools: tools
      ? {
          ...tools,
          internal_answered: tool({
            description:
              'Internal tool to mark that the AI has answered the user.',
            inputSchema: z.object({}),
            execute: async () => null,
          }),
        }
      : undefined,
    stopWhen: tools
      ? [stepCountIs(maxSteps), hasToolCall('internal_answered')]
      : undefined,
  });

  if (tools) {
    return result.steps.map(step => step.text).join('\n');
  }

  return result.text;
}
