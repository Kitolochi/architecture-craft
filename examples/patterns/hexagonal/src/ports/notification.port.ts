// Port (driven/secondary): defines how the domain sends notifications.
// Could be implemented as email, SMS, push notifications, or a simple
// console logger depending on the adapter wired at composition time.

export interface NotificationService {
  sendWelcome(email: string, name: string): Promise<void>;
  sendDeactivation(email: string, name: string): Promise<void>;
  sendPromotion(email: string, name: string): Promise<void>;
}
