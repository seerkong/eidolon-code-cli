import { User } from './User';

/**
 * Example User Service (mock business logic)
 */
export class UserService {
  private users: Map<string, User> = new Map();

  constructor() {
    // Initialize test data
    this.users.set('alice', {
      id: '1',
      username: 'alice',
      email: 'alice@example.com',
      age: 25,
    });
    this.users.set('bob', {
      id: '2',
      username: 'bob',
      email: 'bob@example.com',
      age: 30,
    });
    this.users.set('charlie', {
      id: '3',
      username: 'charlie',
      email: 'charlie@example.com',
      age: 35,
    });
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.get(username);
  }

  searchUsers(keyword?: string): User[] {
    if (!keyword || keyword === '') {
      return Array.from(this.users.values());
    }
    return Array.from(this.users.values()).filter(
      (user) => user.username.includes(keyword) || user.email.includes(keyword)
    );
  }

  createUser(username: string, email: string, age: number): User {
    const id = String(this.users.size + 1);
    const user: User = {
      id,
      username,
      email,
      age,
    };
    this.users.set(username, user);
    return user;
  }
}
