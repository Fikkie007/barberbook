-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "source" "BookingSource" NOT NULL DEFAULT 'ONLINE';
