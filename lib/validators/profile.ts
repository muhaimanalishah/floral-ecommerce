import { z } from "zod";

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const AddressSchema = z.object({
  label: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().optional(),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof AddressSchema>;

export const UpdateAddressSchema = AddressSchema.partial();
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;
