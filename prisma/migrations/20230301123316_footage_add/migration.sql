-- CreateTable
CREATE TABLE "Tag" (
    "name" TEXT NOT NULL,
    "id" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Footage" (
    "name" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "use_cases" TEXT[],
    "downloads" TEXT[],
    "tag_ids" TEXT[],

    CONSTRAINT "Footage_pkey" PRIMARY KEY ("id")
);
