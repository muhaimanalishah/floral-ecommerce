import { z } from "zod";

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(["ORDER_CONFIRMED", "QUALITY_CHECK", "IN_TRANSIT", "DELIVERED"]),
  note: z.string().optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

export const UpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
});
export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;
