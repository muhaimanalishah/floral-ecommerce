import { z } from "zod";

export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  healthRating: z.number().int().min(1).max(5),
  reviewText: z.string().optional(),
  plantPhotoUrl: z.string().url().optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

export const ModerateReviewSchema = z.object({
  isApproved: z.boolean().optional(),
  adminReply: z.string().optional(),
});
export type ModerateReviewInput = z.infer<typeof ModerateReviewSchema>;
