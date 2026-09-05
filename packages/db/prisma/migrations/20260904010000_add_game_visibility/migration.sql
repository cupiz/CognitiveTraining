-- GameVisibility: admin-controlled per-game visibility.
-- Hidden games stay out of the kid world map and parent games
-- page, but remain usable by assessment/training pipelines.

-- CreateTable
CREATE TABLE "game_visibility" (
    "game_key" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_visibility_pkey" PRIMARY KEY ("game_key")
);

-- Defaults: 5 classic anchors hidden, flagship spice_stall shown.
INSERT INTO "game_visibility" ("game_key", "visible") VALUES
    ('memory_matrix', false),
    ('target_watch', false),
    ('quick_match', false),
    ('stop_signal', false),
    ('rule_switch', false),
    ('spice_stall', true);