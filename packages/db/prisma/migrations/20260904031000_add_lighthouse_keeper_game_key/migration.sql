-- Add the lighthouse_keeper flagship to the GameKey enum.
ALTER TYPE "GameKey" ADD VALUE 'lighthouse_keeper';

-- Register lighthouse_keeper as visible by default (flagship; classic games stay hidden).
INSERT INTO "game_visibility" ("game_key", "visible") VALUES ('lighthouse_keeper', true)
ON CONFLICT ("game_key") DO NOTHING;