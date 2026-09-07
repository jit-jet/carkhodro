import { authenticateTorobRequest } from '@/src/lib/torob/auth';
import { getTorobProductResponse } from '@/src/lib/torob/products';
import { parseTorobProductRequest } from '@/src/lib/torob/request';

export async function POST(request: Request) {
  const auth = authenticateTorobRequest(request);
  if (!auth.ok) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'request body must be valid JSON' }, { status: 400 });
  }

  const parsed = parseTorobProductRequest(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    return Response.json(await getTorobProductResponse(parsed.request));
  } catch (error) {
    console.error('[torob:products] failed', error);
    return Response.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
