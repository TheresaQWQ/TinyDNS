import { createSocket } from "node:dgram";
import { parseDNSRequest, encodeDNSResponse } from "@tinydns/protocol";

const socket = createSocket("udp4");

socket.on("message", (message, remote) => {
  try {
    const request = parseDNSRequest(new Uint8Array(message));
    console.log(`[DNS:SERVER:UDP][${new Date().toLocaleString()}] remote: ${remote.address}:${remote.port}, queries: ${request.questions.map(q => `${q.name} ${q.rClass} ${q.type}`).join(", ")}`)

    const response = encodeDNSResponse({
      transactionId: request.transactionId,
      flags: 0x8180,
      questions: request.questions,
      answers: [{
        name: request.questions[0].name,
        type: 1, // A记录类型为1
        ttl: 3600,
        data: new Uint8Array([1, 2, 3, 4])
      }],
      authorities: [],
      additional: [],
    });

    socket.send(response, remote.port, remote.address);
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
