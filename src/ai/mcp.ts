import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { experimental_createMCPClient as createMCPClient } from 'ai';

type TMcpClientOptions = {
  url: string;
  headers?: Record<string, string>;
};

export const createMcpClient = async ({ url, headers }: TMcpClientOptions) => {
  const urlObj = new URL(url);

  return await createMCPClient({
    transport: new StreamableHTTPClientTransport(urlObj, {
      requestInit: {
        headers,
      },
    }),
  });
};
