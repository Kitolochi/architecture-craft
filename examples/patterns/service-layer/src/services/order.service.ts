import type { PaymentGateway } from '../interfaces/payment-gateway';
import type { EventBus } from '../interfaces/event-bus';
import type {
  Order,
  Product,
  CreateOrderDTO,
  OrderItem,
} from '../types/order.types';

interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: { filter?: Partial<T>; limit?: number; offset?: number }): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export class OrderService {
  constructor(
    private orderRepo: Repository<Order>,
    private productRepo: Repository<Product>,
    private paymentGateway: PaymentGateway,
    private eventBus: EventBus
  ) {}

  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    // 1. Validate stock availability
    const items = await this.validateAndResolveItems(dto.items);

    // 2. Calculate total
    const total = this.calculateTotal(items);

    // 3. Create order record
    const order = await this.orderRepo.create({
      userId: dto.userId,
      items,
      status: 'pending',
      total,
    });

    // 4. Process payment
    const chargeResult = await this.paymentGateway.charge({
      orderId: order.id,
      amount: order.total,
      method: dto.paymentMethod,
    });

    if (chargeResult.status === 'failed') {
      await this.orderRepo.update(order.id, { status: 'cancelled' });
      throw new PaymentFailedError(order.id);
    }

    // 5. Confirm order
    const confirmedOrder = await this.orderRepo.update(order.id, {
      status: 'confirmed',
    });

    // 6. Publish domain event
    await this.eventBus.publish('order.created', {
      orderId: confirmedOrder.id,
      userId: dto.userId,
      total: confirmedOrder.total,
      itemCount: items.length,
    });

    return confirmedOrder;
  }

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.userId !== userId) {
      throw new UnauthorizedOrderAccessError(orderId, userId);
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new OrderNotCancellableError(orderId, order.status);
    }

    const cancelled = await this.orderRepo.update(orderId, {
      status: 'cancelled',
    });

    await this.eventBus.publish('order.cancelled', {
      orderId,
      userId,
      reason: 'user_requested',
    });

    return cancelled;
  }

  async getOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    return order;
  }

  async listUserOrders(
    userId: string,
    page = 1,
    pageSize = 20
  ): Promise<Order[]> {
    const offset = (page - 1) * pageSize;
    return this.orderRepo.findAll({
      filter: { userId } as Partial<Order>,
      limit: pageSize,
      offset,
    });
  }

  private async validateAndResolveItems(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<OrderItem[]> {
    const resolved: OrderItem[] = [];

    for (const item of items) {
      const product = await this.productRepo.findById(item.productId);

      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }

      if (product.stock < item.quantity) {
        throw new InsufficientStockError(
          item.productId,
          product.stock,
          item.quantity
        );
      }

      resolved.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    return resolved;
  }

  private calculateTotal(items: OrderItem[]): number {
    return items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  }
}

// Domain errors

export class OrderNotFoundError extends Error {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
    this.name = 'OrderNotFoundError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Product not found: ${productId}`);
    this.name = 'ProductNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor(productId: string, available: number, requested: number) {
    super(
      `Insufficient stock for product ${productId}: available=${available}, requested=${requested}`
    );
    this.name = 'InsufficientStockError';
  }
}

export class PaymentFailedError extends Error {
  constructor(orderId: string) {
    super(`Payment failed for order ${orderId}`);
    this.name = 'PaymentFailedError';
  }
}

export class UnauthorizedOrderAccessError extends Error {
  constructor(orderId: string, userId: string) {
    super(`User ${userId} is not authorized to access order ${orderId}`);
    this.name = 'UnauthorizedOrderAccessError';
  }
}

export class OrderNotCancellableError extends Error {
  constructor(orderId: string, currentStatus: string) {
    super(
      `Order ${orderId} cannot be cancelled (current status: ${currentStatus})`
    );
    this.name = 'OrderNotCancellableError';
  }
}
