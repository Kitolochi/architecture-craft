import { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';

// Composition root: wire dependencies once at startup

const prisma = new PrismaClient();
const userRepository = new PrismaUserRepository(prisma);
const userService = new UserService(userRepository);

// The service is the public API -- route handlers use this, not the repository
export { userService };

// Types are also exported for consumers
export type { User, Repository, PaginatedResult } from './types/repository';
export { UserNotFoundError, DuplicateEmailError } from './services/user.service';
