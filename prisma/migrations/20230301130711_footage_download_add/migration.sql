/*
  Warnings:

  - You are about to drop the column `downloads` on the `Footage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Footage" DROP COLUMN "downloads";

-- CreateTable
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "footageId" TEXT,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_footageId_fkey" FOREIGN KEY ("footageId") REFERENCES "Footage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
