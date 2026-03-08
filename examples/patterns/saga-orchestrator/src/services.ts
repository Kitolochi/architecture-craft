// Simulated external services for the PlaceOrder saga.
//
// In a real system, each service would be a separate microservice
// with its own database. Here they are in-memory simulations that
// can be configured to fail for testing compensation logic.

export interface InventoryItem {
  productId: string;
  available: number;
  reserved: number;
}

export class InventoryService {
  private inventory = new Map<string, InventoryItem>();

  addStock(productId: string, quantity: number): void {
    this.inventory.set(productId, {
      productId,
      available: quantity,
      reserved: 0,
    });
  }

  async reserve(productId: string, quantity: number): Promise<void> {
    const item = this.inventory.get(productId);
    if (!item) {
      throw new Error(`Product ${productId} not found in inventory`);
    }
    if (item.available < quantity) {
      throw new Error(
        `Insufficient stock for ${productId}: need ${quantity}, have ${item.available}`
      );
    }
    item.available -= quantity;
    item.reserved += quantity;
    console.log(
      `  [Inventory] Reserved ${quantity} of ${productId} (available: ${item.available})`
    );
  }

  async unreserve(productId: string, quantity: number): Promise<void> {
    const item = this.inventory.get(productId);
    if (!item) return;
    item.available += quantity;
    item.reserved -= quantity;
    console.log(
      `  [Inventory] Unreserved ${quantity} of ${productId} (available: ${item.available})`
    );
  }

  getItem(productId: string): InventoryItem | undefined {
    return this.inventory.get(productId);
  }
}

export class PaymentService {
  private shouldFail = false;

  // Configure the service to simulate failures for testing
  setFailMode(fail: boolean): void {
    this.shouldFail = fail;
  }

  async charge(orderId: string, amount: number): Promise<string> {
    if (this.shouldFail) {
      throw new Error(`Payment declined for order ${orderId}`);
    }
    const transactionId = `txn-${Date.now()}`;
    console.log(
      `  [Payment] Charged $${amount.toFixed(2)} for order ${orderId} (${transactionId})`
    );
    return transactionId;
  }

  async refund(transactionId: string): Promise<void> {
    console.log(`  [Payment] Refunded transaction ${transactionId}`);
  }
}

export class NotificationService {
  private shouldFail = false;

  setFailMode(fail: boolean): void {
    this.shouldFail = fail;
  }

  async sendConfirmation(orderId: string, email: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error(`Failed to send confirmation email to ${email}`);
    }
    console.log(
      `  [Notification] Sent order confirmation for ${orderId} to ${email}`
    );
  }

  async sendCancellation(orderId: string, email: string): Promise<void> {
    console.log(
      `  [Notification] Sent cancellation notice for ${orderId} to ${email}`
    );
  }
}
