import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const StudentSchema = z.object({
  rollNo: z.string().min(1, 'Roll number is required').toUpperCase(),
  name: z.string().min(1, 'Name is required'),
  gender: z.enum(['M', 'F']),
  dept: z.string().min(1, 'Department is required'),
  hostel: z.string().min(1, 'Hostel is required'),
  room: z.string().min(1, 'Room is required'),
  year: z.string().min(1, 'Year is required'),
  semester: z.string().min(1, 'Semester is required'),
  messFee: z.number().nonnegative('Mess fee must be non-negative'),
  amountPaid: z.number().nonnegative('Amount paid must be non-negative'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  status: z.enum(['Active', 'Inactive', 'On Leave']).default('Active'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be YYYY-MM-DD').default('2003-06-15')
});

export const BulkImportStudentsSchema = z.object({
  students: z.array(StudentSchema)
});

export const BulkDeleteStudentsSchema = z.object({
  rollNumbers: z.array(z.string())
});

export const LeaveSchema = z.object({
  rollNo: z.string().min(1, 'Roll number is required').toUpperCase(),
  leaveStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  leaveEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  reason: z.string().optional(),
  semester: z.string().min(1, 'Semester is required')
});

export const SystemFeesSchema = z.object({
  messFee: z.number().nonnegative('Mess fee must be non-negative')
});

export const MealPricesSchema = z.object({
  bf: z.number().nonnegative('Breakfast price must be non-negative'),
  lu: z.number().nonnegative('Lunch price must be non-negative'),
  di: z.number().nonnegative('Dinner price must be non-negative')
});

export const HostelSchema = z.object({
  name: z.string().min(1, 'Hostel name is required')
});
