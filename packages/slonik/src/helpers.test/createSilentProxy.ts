import { connect, createServer } from "node:net";
import type { AddressInfo, Socket } from "node:net";

/**
 * TCP proxy that can stop forwarding the data that the server sends without closing the connection,
 * like a proxy or a network device that stopped forwarding traffic.
 */
export const createSilentProxy = async (target: { host: string; port: number }) => {
  let isSilent = false;

  const sockets = new Set<Socket>();

  const server = createServer((clientSocket) => {
    const serverSocket = connect(target.port, target.host);

    sockets.add(clientSocket);
    sockets.add(serverSocket);

    const close = () => {
      clientSocket.destroy();
      serverSocket.destroy();

      sockets.delete(clientSocket);
      sockets.delete(serverSocket);
    };

    clientSocket.on("data", (chunk) => {
      serverSocket.write(chunk);
    });

    serverSocket.on("data", (chunk) => {
      if (!isSilent) {
        clientSocket.write(chunk);
      }
    });

    clientSocket.on("close", close);
    clientSocket.on("error", close);
    serverSocket.on("close", close);
    serverSocket.on("error", close);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  return {
    close: async () => {
      for (const socket of sockets) {
        socket.destroy();
      }

      await new Promise((resolve) => {
        server.close(resolve);
      });
    },
    port: (server.address() as AddressInfo).port,
    resume: () => {
      isSilent = false;
    },
    silence: () => {
      isSilent = true;
    },
  };
};
