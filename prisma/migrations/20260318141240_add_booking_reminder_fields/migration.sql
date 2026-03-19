-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "qstashMessageId" TEXT,
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;
