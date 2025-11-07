import { experimental_createMCPClient as sdkCreateMCPClient } from '@ai-sdk/mcp';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createOAuthProvider } from 'mcp-oauth-provider';

export enum AuthMethod {
  NONE = 'none',
  BEARER = 'bearer',
  HEADERS = 'headers',
  OAUTH = 'oauth',
}

type TMcpClientOptions = {
  url: string;
  authMethod: AuthMethod;
  // Authentication properties
  bearerToken?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  oAuth?: {
    clientId?: string;
    clientSecret?: string;
    tokens: {
      tokenType: string;
      accessToken: string;
      refreshToken: string;
      expiresAt?: number;
      scope?: string;
    };
    tokenEndpoint: string;
  };
};

/**
 * Creates an MCP (Model Context Protocol) client with the specified authentication method.
 * Supports multiple authentication methods including bearer tokens, custom headers, and OAuth.
 */
export const createMcpClient = async ({
  url,
  authMethod,
  customHeaders,
  bearerToken,
  oAuth,
}: TMcpClientOptions) => {
  const urlObj = new URL(url);

  let transportOptions;

  if (authMethod === AuthMethod.BEARER || authMethod === AuthMethod.HEADERS) {
    // Build headers for authentication
    const headers: Record<string, string> = {};

    if (authMethod === AuthMethod.BEARER && bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    if (customHeaders && customHeaders.length > 0) {
      customHeaders.forEach(header => {
        headers[header.key] = header.value;
      });
    }

    transportOptions = {
      requestInit: {
        headers,
      },
    };
  }

  // OAuth will be handled by the transport's auth provider
  if (authMethod === AuthMethod.OAUTH && oAuth) {
    const authProvider = createOAuthProvider({
      clientId: oAuth.clientId,
      clientSecret: oAuth.clientSecret,
      tokens: {
        access_token: oAuth.tokens.accessToken,
        refresh_token: oAuth.tokens.refreshToken,
        expires_at: oAuth.tokens.expiresAt,
        token_type: oAuth.tokens.tokenType,
        scope: oAuth.tokens.scope,
      },
      tokenEndpoint: oAuth.tokenEndpoint,
    });

    transportOptions = {
      authProvider,
    };
  }

  return await sdkCreateMCPClient({
    transport: new StreamableHTTPClientTransport(urlObj, transportOptions),
  });
};
