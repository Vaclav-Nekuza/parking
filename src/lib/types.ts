export type UserRole = 'driver' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  name?: string;
  email?: string;
}

export interface SessionContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}