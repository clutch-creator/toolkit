import { tool as createTool, Tool } from 'ai';
import { z } from 'zod';

export { jsonSchema } from 'ai';

type TComponentsSchema = Record<
  string,
  {
    id: string;
    name: string;
    description?: string;
    properties: z.ZodSchema;
  }
>;

type TComponentsTools = Record<string, Tool<unknown, unknown>>;

export function generateToolsFromComponents(
  componentsSchema: TComponentsSchema,
  filter?: string[]
): TComponentsTools {
  return Object.values(componentsSchema || {}).reduce<TComponentsTools>(
    (acc, component) => {
      if (filter && !filter.includes(component.id)) {
        return acc;
      }

      const toolName = `display${component.name}`;

      acc[toolName] = createTool<unknown, unknown>({
        description:
          component.description || `Display a ${component.name} component`,
        inputSchema: component.properties,
        execute: props => props,
      });

      return acc;
    },
    {}
  );
}

type TTools = {
  name: string;
  tools: Record<string, Tool<unknown, unknown>>;
  filter?: string[];
};

function toMcpNaming(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');
}

export function mergeTools(
  ...toolsList: TTools[]
): Record<string, Tool<unknown, unknown>> {
  return toolsList.reduce<Record<string, Tool<unknown, unknown>>>(
    (acc, { name, tools, filter }) => {
      const normalizedScope = toMcpNaming(name);

      Object.entries(tools).forEach(([name, tool]) => {
        if (filter && !filter.includes(name)) {
          return;
        }

        if (!acc[name]) {
          acc[name] = tool;
        } else {
          let newName = `${normalizedScope}_${name}`;
          let counter = 2;

          while (acc[newName]) {
            newName = `${normalizedScope}_${name}_${counter}`;
            counter++;
          }

          acc[newName] = tool;
        }
      });

      return acc;
    },
    {}
  );
}
