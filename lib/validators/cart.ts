import { z } from "zod";

export const AddToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
});
export type AddToCartInput = z.infer<typeof AddToCartSchema>;

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
