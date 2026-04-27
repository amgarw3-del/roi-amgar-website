export interface ChatSource {
  id: number;
  title: string;
  type: string;
  typeLabel: string;
  category?: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  pending?: boolean;
}
