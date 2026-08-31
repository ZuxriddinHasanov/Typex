import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { verifyToken } from "../utils/jwt";
import Logger from "../utils/logger";

const clients = new Map<string, Set<WebSocket>>();

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    Logger.info("WS connection attempt: " + req.url);
    let uid: string | null = null;
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (token) {
      try {
        const decoded = verifyToken(token);
        uid = decoded.uid;
        if (!clients.has(uid)) {
          clients.set(uid, new Set());
        }
        clients.get(uid)!.add(ws);
        Logger.info("WS authenticated for " + uid);
      } catch (e) {
        // invalid token
      }
    }

    ws.on("close", () => {
      if (uid && clients.has(uid)) {
        clients.get(uid)!.delete(ws);
        if (clients.get(uid)!.size === 0) {
          clients.delete(uid);
        }
      }
    });
  });

  Logger.success("WebSocket server initialized");
}

export function notifyUserInbox(uid: string) {
  if (clients.has(uid)) {
    const userClients = clients.get(uid)!;
    for (const ws of userClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "NEW_INBOX" }));
      }
    }
  }
}

