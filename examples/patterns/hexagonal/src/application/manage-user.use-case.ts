import type { UserRepository } from '../ports/user-repository.port';
import type { NotificationService } from '../ports/notification.port';
import type { User } from '../domain/user';

// Additional use cases that demonstrate the hexagonal boundary.
// Each use case is a single application-level operation that
// coordinates domain objects and infrastructure ports.

export class PromoteUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private notificationService: NotificationService
  ) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // Domain logic: the entity enforces its own invariants
    user.promote();

    await this.userRepository.save(user);
    await this.notificationService.sendPromotion(user.email, user.name);

    return user;
  }
}

export class DeactivateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private notificationService: NotificationService
  ) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    user.deactivate();

    await this.userRepository.save(user);
    await this.notificationService.sendDeactivation(user.email, user.name);

    return user;
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}
