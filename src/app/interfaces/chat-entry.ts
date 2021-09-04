import { ChatMessage } from "./chat-message";

export interface ChatEntry {
  targetId: string,
  _id: string,
  name: string,
  messages: ChatMessage[],
  minimize: boolean
}
