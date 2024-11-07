import { createSocket } from "node:dgram";
import { parseDNSRequest, encodeDNSResponse } from "@tinydns/protocol";
import type Resolver from "@tinydns/resolver";

const resolver = await import(process.env.RESOLVER_PROVIDER ?? "@tinydns/resolver");
const resolverClass = resolver.default ? resolver.default : resolver;
const resolverInstance = new resolverClass() as Resolver;

const socket = createSocket("udp4");

socket.on("message", async (message, remote) => {
  try {
    const request = parseDNSRequest(new Uint8Array(message));
    console.log(`[DNS:SERVER:UDP][${new Date().toLocaleString()}] remote: ${remote.address}:${remote.port}, queries: ${request.questions.map(q => `${q.name} ${q.rClass} ${q.type}`).join(", ")}`)

    const response = await resolverInstance.resolve(request);

    socket.send(encodeDNSResponse(response), remote.port, remote.address);
  } catch (error) {
    console.error(error);
  }
});

socket.on("error", (error) => {
  console.error(error);
});

const port = Number.parseInt(process.env.SERVER_UDP_PORT ?? "53");
const address = process.env.SERVER_UDP_ADDRESS ?? "0.0.0.0";

socket.bind(port, address, () => {
  console.log(`[DNS:SERVER:UDP][${new Date().toLocaleString()}] Listening on ${address}:${port}`)
});
