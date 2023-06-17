/*
  Warnings:

  - You are about to drop the column `footageId` on the `Download` table. All the data in the column will be lost.
  - You are about to drop the `Footage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `contentId` to the `Download` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Download" DROP CONSTRAINT "Download_footageId_fkey";

-- AlterTable
ALTER TABLE "Download" DROP COLUMN "footageId",
ADD COLUMN     "contentId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Footage";

-- CreateTable
CREATE TABLE "Content" (
    "name" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "use_cases" TEXT[],
    "tag_ids" TEXT[],

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
