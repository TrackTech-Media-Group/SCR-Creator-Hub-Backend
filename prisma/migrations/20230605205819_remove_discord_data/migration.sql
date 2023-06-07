/*
  Warnings:

  - You are about to drop the column `access_token` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_date` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "access_token",
DROP COLUMN "refresh_date",
DROP COLUMN "refresh_token";
