import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Al menos 1 letra mayúscula')
    .regex(/[0-9]/, 'Al menos 1 número'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const accountTypeSchema = z.object({
  accountType: z.enum(['buyer', 'particular', 'empresa']),
});

export const personalDataBuyerSchema = z.object({
  accountType: z.literal('buyer'),
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
});

export const personalDataParticularSchema = z.object({
  accountType: z.literal('particular'),
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().min(7, 'Teléfono inválido'),
  cedula: z.string().optional(),
});

export const personalDataEmpresaSchema = z.object({
  accountType: z.literal('empresa'),
  companyName: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().min(7, 'Teléfono inválido'),
});

export const personalDataSchema = z.discriminatedUnion('accountType', [
  personalDataBuyerSchema,
  personalDataParticularSchema,
  personalDataEmpresaSchema,
]);

export const companyDataSchema = z.object({
  ruc: z.string().min(6, 'RUC inválido').max(20, 'RUC muy largo'),
  hasWebsite: z.boolean(),
  websiteUrl: z.string().url('URL inválida').optional().or(z.literal('')),
}).refine((d) => !d.hasWebsite || (d.websiteUrl && d.websiteUrl.length > 0), {
  message: 'URL requerida si tenés web propia',
  path: ['websiteUrl'],
});

export type CredentialsForm = z.infer<typeof credentialsSchema>;
export type AccountTypeForm = z.infer<typeof accountTypeSchema>;
export type PersonalDataForm = z.infer<typeof personalDataSchema>;
export type CompanyDataForm = z.infer<typeof companyDataSchema>;
