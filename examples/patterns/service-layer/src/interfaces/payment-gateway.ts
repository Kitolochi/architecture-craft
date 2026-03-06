import type { ChargeRequest, ChargeResult } from '../types/order.types';

export interface PaymentGateway {
  charge(request: ChargeRequest): Promise<ChargeResult>;
  refund(transactionId: string, amount: number): Promise<void>;
}
