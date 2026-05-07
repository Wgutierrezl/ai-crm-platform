export interface AIAction {
  type: 'GET_PRODUCTS' | 'CREATE_CUSTOMER' | 'CREATE_ORDER' | string;
  payload?: Record<string, any>;
}

export interface AIResponse {
  reply: string;
  action?: AIAction;
}

export interface AIMessageInput {
  conversationId: string;
  companyId: string;
  customerMessage: string;
  history: Array<{ role: 'customer' | 'agent' | 'bot'; content: string }>;
  assistantContext?: Record<string, unknown>;
}

export abstract class AIService {
  abstract processMessage(input: AIMessageInput): Promise<AIResponse>;
}
