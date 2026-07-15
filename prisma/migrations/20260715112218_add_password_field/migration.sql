-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hashedPassword" TEXT,
ALTER COLUMN "supabaseUserId" DROP NOT NULL;
