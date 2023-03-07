-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bookmarks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "recent" TEXT[] DEFAULT ARRAY[]::TEXT[];
