import { JSONSchema, JSONSchemaToZod } from '@dmitryrechkin/json-schema-to-zod';
import { tool as createTool, Schema, Tool } from 'ai';
import { z } from 'zod';

export { jsonSchema } from 'ai';

/**
 * Schema definition for components used in tool generation.
 * Maps component IDs to their metadata and validation schemas.
 */
type TComponentsSchema = Record<
  string,
  {
    id: string;
    name: string;
    description?: string;
    properties: z.ZodSchema;
  }
>;

/**
 * Collection of AI tools mapped by their names.
 */
type TComponentsTools = Record<string, Tool<unknown, unknown>>;

/**
 * Generates AI tools from component schemas.
 * Creates a tool for each component that can be used to display it.
 *
 * @param componentsSchema - Schema definitions for all components
 * @param filter - Optional array of component IDs to include (if not provided, all components are included)
 * @returns Object mapping tool names to Tool instances
 *
 * @example
 * ```ts
 * const tools = generateToolsFromComponents(schema, ['header', 'footer']);
 * // Returns { displayHeader: Tool, displayFooter: Tool }
 * ```
 */
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

/**
 * Configuration object for merging multiple tool collections.
 */
type TTools = {
  name: string;
  tools: Record<string, Tool<unknown, unknown>>;
  filter?: string[];
};

/**
 * Converts a string to MCP (Model Context Protocol) naming convention.
 * Normalizes to lowercase with underscores, suitable for tool identifiers.
 *
 * @param str - The string to convert
 * @returns Normalized string in snake_case format
 *
 * @example
 * ```ts
 * toMcpNaming('MyComponent') // 'my_component'
 * toMcpNaming('some-name') // 'some_name'
 * ```
 */
function toMcpNaming(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');
}

/**
 * Merges multiple tool collections into a single object.
 * Handles name conflicts by prefixing with scope and adding counters if needed.
 *
 * @param toolsList - Variable number of tool collections to merge
 * @returns Combined object with all tools, with conflicts resolved via naming
 *
 * @example
 * ```ts
 * const merged = mergeTools(
 *   { name: 'ui', tools: { button: buttonTool } },
 *   { name: 'forms', tools: { button: formButtonTool } }
 * );
 * // Returns { button: buttonTool, forms_button: formButtonTool }
 * ```
 */
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

/**
 * Converts AI SDK input schema to Zod raw shape object.
 * Transforms JSON Schema properties into Zod schema definitions with proper optionality.
 *
 * @param inputSchema - The AI SDK schema to convert (can be undefined)
 * @returns Zod raw shape object suitable for z.object() construction
 *
 * @example
 * ```ts
 * const schema = { jsonSchema: { properties: { name: { type: 'string' } } } };
 * const shape = aiSdkInputSchemaToZodRawShape(schema);
 * const zodSchema = z.object(shape);
 * ```
 */
export function aiSdkInputSchemaToZodRawShape(
  inputSchema: Schema | undefined
): z.ZodRawShape {
  const shape: z.ZodRawShape = {};

  if (!inputSchema) {
    return shape;
  }

  const jsonSchema = inputSchema?.jsonSchema;

  Object.entries(jsonSchema?.properties || {}).forEach(([key, prop]) => {
    if (typeof prop !== 'object') {
      return;
    }

    shape[key] = JSONSchemaToZod.convert(prop as JSONSchema).describe(
      prop.description || ''
    );

    // optionality
    if (
      jsonSchema.required &&
      Array.isArray(jsonSchema.required) &&
      !jsonSchema.required.includes(key)
    ) {
      shape[key] = shape[key].optional();
    }
  });

  return shape;
}
