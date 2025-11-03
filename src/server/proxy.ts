import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type TProxy = (
  request: NextRequest,
  response: NextResponse,
  event: NextFetchEvent
) => Promise<NextResponse | void | undefined>;

const REDIRECT_TAGS = [301, 302, 303, 307, 308];

export async function proxyPipe(
  pluginsProxies: TProxy[],
  request: NextRequest,
  event: NextFetchEvent
) {
  let response = NextResponse.next();

  for (const plugin of pluginsProxies) {
    // eslint-disable-next-line no-await-in-loop
    const proxyResp = await plugin(request, response, event);

    if (proxyResp) {
      if (
        REDIRECT_TAGS.includes(proxyResp.status) ||
        proxyResp.headers.get('x-middleware-rewrite') ||
        proxyResp.headers.get('x-proxy-rewrite')
      ) {
        return proxyResp;
      }

      response = proxyResp;
    }
  }

  return response;
}
