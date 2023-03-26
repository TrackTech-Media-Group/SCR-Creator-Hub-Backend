/*
  Warnings:

  - The `use_cases` column on the `Footage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tag_ids` column on the `Footage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bookmarks` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `recent` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Footage" DROP COLUMN "use_cases",
ADD COLUMN     "use_cases" TEXT[],
DROP COLUMN "tag_ids",
ADD COLUMN     "tag_ids" TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bookmarks",
ADD COLUMN     "bookmarks" TEXT[],
DROP COLUMN "recent",
ADD COLUMN     "recent" TEXT[];
