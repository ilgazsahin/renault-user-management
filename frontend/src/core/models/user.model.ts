export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  username: string;
  fullName: string;
  email: string;
  role: 'admin' | 'user';
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateUserDto {
  username?: string;
  password?: string;
  fullName?: string;
  email?: string;
  role?: 'admin' | 'user';
}
