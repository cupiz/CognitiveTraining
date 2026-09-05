-- Add the sushi_express flagship to the GameKey enum.
ALTER TYPE "GameKey" ADD VALUE 'sushi_express';

-- Register sushi_express as visible by default (flagship; classic games stay hidden).
INSERT INTO "game_visibility" ("game_key", "visible") VALUES ('sushi_express', true)
ON CONFLICT ("game_key") DO NOTHING;