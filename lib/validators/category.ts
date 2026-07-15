import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
export type CategoryInput = z.infer<typeof CategorySchema>;

export const UpdateCategorySchema = CategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
