-- CreateEnum
CREATE TYPE "Kind" AS ENUM ('BOOK', 'COMIC');

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "kind" "Kind" NOT NULL,
    "genre" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "synopsis" TEXT NOT NULL,
    "isbn" TEXT,
    "coverUrl" TEXT,
    "series" TEXT,
    "issueNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_isbn_key" ON "Item"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "Item_title_author_kind_key" ON "Item"("title", "author", "kind");
