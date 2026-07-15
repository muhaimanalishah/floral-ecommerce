import { z } from "zod";

export const CreateProductSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  botanicalName: z.string().optional(),
  productType: z.enum(["PLANT", "ACCESSORY"]).default("PLANT"),
  price: z.number().positive(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE"]).optional(),
  sunlightReq: z.string().optional(),
  wateringFreq: z.string().optional(),
  soilType: z.string().optional(),
  temperatureRange: z.string().optional(),
  lowMaintenance: z.boolean().default(false),
  petFriendly: z.boolean().default(false),
  growthRate: z.enum(["SLOW", "FAST"]).optional(),
  stockQty: z.number().int().min(0).default(0),
  description: z.string().optional(),
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
