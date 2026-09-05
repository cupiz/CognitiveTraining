-- Add the crystal_palace flagship to the GameKey enum.
ALTER TYPE "GameKey" ADD VALUE 'crystal_palace';

-- Register crystal_palace as visible by default (flagship; classic games stay hidden).
INSERT INTO "game_visibility" ("game_key", "visible") VALUES ('crystal_palace', true)
ON CONFLICT ("game_key") DO NOTHING;