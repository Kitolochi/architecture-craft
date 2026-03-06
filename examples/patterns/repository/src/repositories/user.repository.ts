import type { PrismaClient } from '@prisma/client';
import type { Repository, User, PaginatedResult } from '../types/repository';

export class PrismaUserRepository implements Repository<User> {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findAll({ filter, limit = 50, offset = 0 } = {}): Promise<User[]> {
    return this.prisma.user.findMany({
      where: filter,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async count(filter?: Partial<User>): Promise<number> {
    return this.prisma.user.count({ where: filter });
  }

  // Extended methods beyond the generic interface

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findPaginated(
    options: { filter?: Partial<User>; limit?: number; offset?: number } = {}
  ): Promise<PaginatedResult<User>> {
    const { filter, limit = 50, offset = 0 } = options;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: filter,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: filter }),
    ]);

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }
}
