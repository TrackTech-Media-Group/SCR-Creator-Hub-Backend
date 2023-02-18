/*
  Warnings:

  - Added the required column `access_token` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refresh_date` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refresh_token` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "access_token" TEXT NOT NULL,
ADD COLUMN     "refresh_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "refresh_token" TEXT NOT NULL;
