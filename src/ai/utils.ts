import { tool as createTool, Tool } from 'ai';

type TComponentsSchema = Record<
  string,
  {
    name: string;
    description?: string;
    properties: any;
  }
>;

type TComponentsTools = Record<string, Tool<unknown, unknown>>;

export function generateToolsFromComponents(
  componentsSchema: TComponentsSchema
): TComponentsTools {
  return Object.values(componentsSchema || {}).reduce<TComponentsTools>(
    (acc, component) => {
      const toolName = `display${component.name}`;

      acc[toolName] = createTool({
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
