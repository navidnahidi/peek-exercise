export interface CreateOrderRequest {
  email: string;
  amount: string | number;
}

export interface GetOrdersForCustomerRequest {
  email: string;
  limit?: string | number;
  page?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ApplyPaymentRequest {
  amount: string | number;
}

export interface CreateOrderAndPayRequest {
  email: string;
  amount: string | number;
  paymentAmount: string | number;
}
