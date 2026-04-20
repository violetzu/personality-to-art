-- CreateTable
CREATE TABLE "Participant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "tipi1" INTEGER NOT NULL,
    "tipi2" INTEGER NOT NULL,
    "tipi3" INTEGER NOT NULL,
    "tipi4" INTEGER NOT NULL,
    "tipi5" INTEGER NOT NULL,
    "tipi6" INTEGER NOT NULL,
    "tipi7" INTEGER NOT NULL,
    "tipi8" INTEGER NOT NULL,
    "tipi9" INTEGER NOT NULL,
    "tipi10" INTEGER NOT NULL,
    "panasActive" INTEGER NOT NULL,
    "panasAlert" INTEGER NOT NULL,
    "panasAttentive" INTEGER NOT NULL,
    "panasDetermined" INTEGER NOT NULL,
    "panasInspired" INTEGER NOT NULL,
    "panasAfraid" INTEGER NOT NULL,
    "panasAshamed" INTEGER NOT NULL,
    "panasHostile" INTEGER NOT NULL,
    "panasNervous" INTEGER NOT NULL,
    "panasUpset" INTEGER NOT NULL,
    "extraversion" DOUBLE PRECISION NOT NULL,
    "agreeableness" DOUBLE PRECISION NOT NULL,
    "conscientiousness" DOUBLE PRECISION NOT NULL,
    "stability" DOUBLE PRECISION NOT NULL,
    "openness" DOUBLE PRECISION NOT NULL,
    "selfArtPrompt" TEXT,
    "selfDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" SERIAL NOT NULL,
    "participantId" INTEGER NOT NULL,
    "promptText" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- AddForeignKey
ALTER TABLE "Prompt" ADD CONSTRAINT "Prompt_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
