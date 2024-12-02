import { Hono } from 'hono';
import { parseDNSRequest, encodeDNSResponse } from '@tinydns/protocol';
import type Resolver from '@tinydns/resolver';

const resolver = await import(process.env.RESOLVER_PROVIDER ?? '@tinydns/resolver');
const resolverClass = resolver.default ? resolver.default : resolver;
const resolverInstance = new resolverClass() as Resolver;

const app = new Hono();

app.post('/dns-query', async (c) => {
  try {
    const body = await c.req.arrayBuffer();
    const request = parseDNSRequest(new Uint8Array(body));
    console.log(`[DNS:SERVER:DoH][${new Date().toLocaleString()}] queries: ${request.questions.map(q => `${q.name} ${q.rClass} ${q.type}`).join(", ")}`);

    const response = await resolverInstance.resolve(request);
    const responseData = encodeDNSResponse(response);

    return c.body(responseData.buffer, 200, {
      'Content-Type': 'application/dns-message'
    });
  } catch (error) {
    console.error(error);
    return c.text('Internal Server Error', 500);
  }
});

const port = Number.parseInt(process.env.SERVER_DOH_PORT ?? '443');
const address = process.env.SERVER_DOH_ADDRESS ?? '0.0.0.0';

app.listen(port, address, () => {
  console.log(`[DNS:SERVER:DoH][${new Date().toLocaleString()}] Listening on ${address}:${port}`);
});
