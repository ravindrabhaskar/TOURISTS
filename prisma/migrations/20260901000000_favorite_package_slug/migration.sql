-- Shortlisted trips come from the editorial catalogue rather than TourPackage,
-- so they are referenced by slug. Widens the uniqueness key accordingly so a
-- user can hold one favourite per trip alongside destination/stay favourites.
ALTER TABLE "Favorite" ADD COLUMN "packageSlug" TEXT;

DROP INDEX "Favorite_userId_targetType_destinationId_stayId_eventId_key";

CREATE UNIQUE INDEX "Favorite_userId_targetType_destinationId_stayId_eventId_pac_key"
  ON "Favorite"("userId", "targetType", "destinationId", "stayId", "eventId", "packageSlug");

CREATE INDEX "Favorite_userId_targetType_idx" ON "Favorite"("userId", "targetType");
