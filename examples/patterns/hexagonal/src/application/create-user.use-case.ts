import { User } from '../domain/user';
import type { UserRepository } from '../ports/user-repository.port';
import type { NotificationService } from '../ports/notification.port';

// Application layer use case: orchestrates domain logic and infrastructure.
// Depends only on ports (interfaces), never on concrete adapters.
// This is where the "hexagonal" boundary becomes visible -- the use case
// sits inside the hexagon and talks to the outside world through ports.

export interface CreateUserDTO {
  email: string;
  name: string;
  role?: 'admin' | 'member';
}

export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private notificationService: NotificationService
  ) {}

  async execute(dto: CreateUserDTO): Promise<User> {
    // Check for duplicate email (application rule, not domain rule)
    const existing = await this.userRepository.findByEmail(dto.email.toLowerCase().trim());
    if (existing) {
      throw new DuplicateEmailError(dto.email);
    }

    // Domain creates and validates the entity
    const user = User.create({
      email: dto.email,
      name: dto.name,
      role: dto.role,
    });

    // Persist through the repository port
    await this.userRepository.save(user);

    // Notify through the notification port
    await this.notificationService.sendWelcome(user.email, user.name);

    return user;
  }
}

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`A user with email "${email}" already exists`);
    this.name = 'DuplicateEmailError';
  }
}
