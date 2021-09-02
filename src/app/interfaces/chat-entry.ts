import { ChatMessage } from "./chat-message";

export interface ChatEntry {
  _id: string,
  socketId: string,
  name: string,
  messages: [] | [ChatMessage]
}
