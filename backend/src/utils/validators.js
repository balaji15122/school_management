const { z } = require('zod');

const registerSchoolSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters').max(100),
  schoolCode: z
    .string()
    .min(2, 'School code must be at least 2 characters')
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'School code must contain only alphanumeric characters, dashes, or underscores'),
  schoolAddress: z.string().optional().default(''),
  schoolContactEmail: z.string().email('Invalid school contact email'),
  schoolContactPhone: z.string().optional().default(''),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid admin email'),
  adminPhone: z.string().optional().default(''),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const studentRecordSchema = z.object({
  name: z.string().min(2, 'Student Full Name must be at least 2 characters'),
  admissionNumber: z.string().min(1, 'Admission Number / Student ID is required'),
  class: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  rollNumber: z.string().min(1, 'Roll Number is required'),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date of birth format',
  }),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Gender must be male, female, or other' }),
  }),
  bloodGroup: z.string().optional().default(''),
  academicSession: z.string().min(4, 'Academic Session is required (e.g., 2026–27)'),
  photoUrl: z.string().nullable().optional().default(null),
  status: z.enum(['draft', 'forwarded', 'pending', 'verified', 'rejected']).optional().default('forwarded'),
});

const studentStatusUpdateSchema = z.object({
  status: z.enum(['draft', 'forwarded', 'pending', 'verified', 'rejected']),
  rejectionReason: z.string().optional().default(''),
});

const bulkStatusUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one student ID is required'),
  status: z.enum(['draft', 'forwarded', 'pending', 'verified', 'rejected']),
  rejectionReason: z.string().optional().default(''),
});

const forwardStudentsSchema = z.object({
  ids: z.array(z.string()).optional(),
});

module.exports = {
  registerSchoolSchema,
  loginSchema,
  studentRecordSchema,
  studentStatusUpdateSchema,
  bulkStatusUpdateSchema,
  forwardStudentsSchema,
};
