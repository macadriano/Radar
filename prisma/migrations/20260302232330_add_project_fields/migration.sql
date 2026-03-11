-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "estimatedEndDate" TIMESTAMP(3),
ADD COLUMN     "leaderUid" TEXT,
ADD COLUMN     "scopeDescription" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "type" TEXT;
