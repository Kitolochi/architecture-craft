import type { Repository, User } from '../types/repository';

export class UserService {
  constructor(private userRepo: Repository<User>) {}

  async getUser(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return user;
  }

  async listUsers(page = 1, pageSize = 50): Promise<User[]> {
    const offset = (page - 1) * pageSize;
    return this.userRepo.findAll({ limit: pageSize, offset });
  }

  async createUser(data: {
    email: string;
    name: string;
    role?: 'admin' | 'user';
  }): Promise<User> {
    const existing = await this.userRepo.findAll({
      filter: { email: data.email } as Partial<User>,
      limit: 1,
    });

    if (existing.length > 0) {
      throw new DuplicateEmailError(data.email);
    }

    return this.userRepo.create({
      email: data.email,
      name: data.name,
      role: data.role ?? 'user',
    });
  }

  async updateUser(
    id: string,
    data: { name?: string; role?: 'admin' | 'user' }
  ): Promise<User> {
    await this.getUser(id); // Throws if not found
    return this.userRepo.update(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUser(id); // Throws if not found
    await this.userRepo.delete(id);
  }

  async getUserCount(): Promise<number> {
    return this.userRepo.count();
  }
}

export class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User not found: ${id}`);
    this.name = 'UserNotFoundError';
  }
}

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`A user with email "${email}" already exists`);
    this.name = 'DuplicateEmailError';
  }
}
