import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type TMiddleware = (
  request: NextRequest,
  response: NextResponse,
  event: NextFetchEvent
) => Promise<NextResponse | void | undefined>;

const REDIRECT_TAGS = [301, 302, 303, 307, 308];

export async function middlewarePipe(
  pluginsMiddlewares: TMiddleware[],
  request: NextRequest,
  event: NextFetchEvent
) {
  let response = NextResponse.next();

  for (const plugin of pluginsMiddlewares) {
    const middlewareResp = await plugin(request, response, event);

    if (middlewareResp) {
      if (
        REDIRECT_TAGS.includes(middlewareResp.status) ||
        middlewareResp.headers.get('x-middleware-rewrite')
      ) {
        return middlewareResp;
      }

      response = middlewareResp;
    }
  }

  return response;
}
