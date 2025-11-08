export type UserRole = 'driver' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  name?: string;
  email?: string;
  image?: string;
}

export interface SessionContextType {
  user: User | null;
  login: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  nextAuthSession?: unknown;
  isOAuthAuthenticated?: boolean;
  isLoading?: boolean;
}