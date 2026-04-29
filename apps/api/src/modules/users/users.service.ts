import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, DrizzleDB } from '../../database/database.module';
import { users } from '../../database/schema';
import { User } from '@fundy/shared';

@Injectable()
export class UsersService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async findById(id: string): Promise<User> {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new NotFoundException('User not found');
    return { ...user, createdAt: user.createdAt.toISOString() };
  }

  async findAll(): Promise<User[]> {
    const rows = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users);

    return rows.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
  }

  async updateName(id: string, name: string): Promise<void> {
    await this.db.update(users).set({ name }).where(eq(users.id, id));
  }
}
