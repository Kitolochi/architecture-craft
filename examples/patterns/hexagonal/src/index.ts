import { InMemoryUserRepository } from './adapters/in-memory-user.repository';
import { ConsoleNotificationService } from './adapters/console-notification.service';
import { CreateUserUseCase } from './application/create-user.use-case';
import { PromoteUserUseCase, DeactivateUserUseCase } from './application/manage-user.use-case';

// Composition root: wire adapters to ports.
// This is the only place that knows about concrete implementations.
// Swapping InMemoryUserRepository for PostgresUserRepository or
// ConsoleNotificationService for SendGridNotificationService
// requires changing only these lines.

const userRepository = new InMemoryUserRepository();
const notificationService = new ConsoleNotificationService();

const createUser = new CreateUserUseCase(userRepository, notificationService);
const promoteUser = new PromoteUserUseCase(userRepository, notificationService);
const deactivateUser = new DeactivateUserUseCase(userRepository, notificationService);

// --- Demo: exercise the full hexagonal flow ---

async function main() {
  // 1. Create users through the application layer
  const alice = await createUser.execute({
    email: 'alice@example.com',
    name: 'Alice Johnson',
  });
  console.log(`Created user: ${alice.name} (${alice.role})`);

  const bob = await createUser.execute({
    email: 'bob@example.com',
    name: 'Bob Smith',
    role: 'admin',
  });
  console.log(`Created user: ${bob.name} (${bob.role})`);

  // 2. Promote Alice to admin
  const promoted = await promoteUser.execute(alice.id);
  console.log(`Promoted: ${promoted.name} is now ${promoted.role}`);

  // 3. Deactivate Bob
  const deactivated = await deactivateUser.execute(bob.id);
  console.log(`Deactivated: ${deactivated.name}, active=${deactivated.active}`);

  // 4. Try to create a duplicate user (should fail)
  try {
    await createUser.execute({ email: 'alice@example.com', name: 'Alice Clone' });
  } catch (err) {
    console.log(`Expected error: ${(err as Error).message}`);
  }

  // 5. Try to promote an already-admin user (should fail)
  try {
    await promoteUser.execute(alice.id);
  } catch (err) {
    console.log(`Expected error: ${(err as Error).message}`);
  }

  // 6. List all users from the repository
  const allUsers = await userRepository.findAll();
  console.log(`\nAll users (${allUsers.length}):`);
  for (const u of allUsers) {
    console.log(`  ${u.name} <${u.email}> role=${u.role} active=${u.active}`);
  }
}

main().catch(console.error);

export { CreateUserUseCase, PromoteUserUseCase, DeactivateUserUseCase };
export { InMemoryUserRepository } from './adapters/in-memory-user.repository';
export { ConsoleNotificationService } from './adapters/console-notification.service';
export { User } from './domain/user';
export type { UserRepository } from './ports/user-repository.port';
export type { NotificationService } from './ports/notification.port';
