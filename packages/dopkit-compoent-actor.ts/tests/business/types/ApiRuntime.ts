import { UserService } from './UserService';

/**
 * Example API Runtime Context
 */
export interface ApiRuntime {
  appId: string;
  userId: string;
  userService: UserService;
}
