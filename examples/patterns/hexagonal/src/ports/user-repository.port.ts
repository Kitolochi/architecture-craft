import type { User } from '../domain/user';

// Port (driven/secondary): defines what the domain needs from persistence.
// The domain declares the interface; adapters implement it.
// This is the key to dependency inversion -- the domain never depends
// on concrete infrastructure, only on this abstract contract.

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  delete(id: string): Promise<void>;
}
