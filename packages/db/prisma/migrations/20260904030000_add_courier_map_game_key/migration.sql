-- Add the courier_map flagship to the GameKey enum.
ALTER TYPE "GameKey" ADD VALUE 'courier_map';

-- Register courier_map as visible by default (flagship; classic games stay hidden).
INSERT INTO "game_visibility" ("game_key", "visible") VALUES ('courier_map', true)
ON CONFLICT ("game_key") DO NOTHING;