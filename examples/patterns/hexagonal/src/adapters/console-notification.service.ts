import type { NotificationService } from '../ports/notification.port';

// Adapter (driven/secondary): logs notifications to the console.
// In production, swap this for an EmailNotificationService or
// SmsNotificationService without changing any application logic.

export class ConsoleNotificationService implements NotificationService {
  async sendWelcome(email: string, name: string): Promise<void> {
    console.log(`[Notification] Welcome email sent to ${name} <${email}>`);
  }

  async sendDeactivation(email: string, name: string): Promise<void> {
    console.log(`[Notification] Deactivation notice sent to ${name} <${email}>`);
  }

  async sendPromotion(email: string, name: string): Promise<void> {
    console.log(`[Notification] Promotion notice sent to ${name} <${email}>`);
  }
}
