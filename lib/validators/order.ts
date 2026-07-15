import { z } from "zod";

export const PlaceOrderSchema = z.object({
  addressId: z.string().min(1),
  deliveryDate: z.iso.datetime().optional(),
  specialInstructions: z.string().optional(),
});
export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;
