export interface AIAction {
  type:
    | 'GET_PRODUCTS'
    | 'CREATE_CUSTOMER'
    | 'CREATE_ORDER'
    | 'CRM_GET_PRODUCTS'
    | 'CRM_SEARCH_PRODUCTS'
    | 'CRM_GET_PRODUCT_BY_NAME'
    | 'CRM_FILTER_PRODUCTS_BY_PRICE'
    | 'CRM_GET_PRODUCT_STOCK'
    | string;
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
