import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// User type derived from schema
export type User = z.infer<typeof userSchema>;

// User creation schema (without id and timestamps)
export const createUserSchema = userSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type CreateUser = z.infer<typeof createUserSchema>;

// User update schema (all fields optional)
export const updateUserSchema = createUserSchema.partial();

export type UpdateUser = z.infer<typeof updateUserSchema>;

// User login schema
export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginUser = z.infer<typeof loginUserSchema>;