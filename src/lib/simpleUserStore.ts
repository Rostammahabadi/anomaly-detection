// Simple in-memory user store for development
// In production, this should be replaced with a proper database

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: Date;
}

class SimpleUserStore {
  private users: User[] = [];
  private nextId = 1;

  async findUnique(where: { username: string }): Promise<User | null> {
    return this.users.find((user) => user.username === where.username) || null;
  }

  async create(data: {
    username: string;
    password_hash: string;
  }): Promise<User> {
    const user: User = {
      id: this.nextId++,
      username: data.username,
      password_hash: data.password_hash,
      created_at: new Date(),
    };
    this.users.push(user);
    return user;
  }

  // Method to get all users (for debugging)
  getAllUsers(): User[] {
    return this.users;
  }

  // Method to clear all users (for testing)
  clearUsers(): void {
    this.users = [];
    this.nextId = 1;
  }
}

// Export a singleton instance
export const userStore = new SimpleUserStore();
