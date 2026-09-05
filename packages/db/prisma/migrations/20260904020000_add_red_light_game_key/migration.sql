-- Add the red_light flagship to the GameKey enum.
ALTER TYPE "GameKey" ADD VALUE 'red_light';

-- Register red_light as visible by default (flagship; classic games stay hidden).
INSERT INTO "game_visibility" ("game_key", "visible") VALUES ('red_light', true)
ON CONFLICT ("game_key") DO NOTHING;