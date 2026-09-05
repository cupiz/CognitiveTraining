-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('parent', 'admin', 'researcher');

-- CreateEnum
CREATE TYPE "ChildStatus" AS ENUM ('active', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('training', 'assessment', 'analytics', 'research');

-- CreateEnum
CREATE TYPE "ConsentSource" AS ENUM ('parent_portal', 'api', 'migration');

-- CreateEnum
CREATE TYPE "CognitiveDomain" AS ENUM ('working_memory', 'sustained_attention', 'processing_speed', 'inhibitory_control', 'cognitive_flexibility', 'visual_spatial');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('pending', 'in_progress', 'completed', 'interrupted', 'abandoned');

-- CreateEnum
CREATE TYPE "TrainingSessionStatus" AS ENUM ('pending', 'in_progress', 'completed', 'interrupted', 'abandoned');

-- CreateEnum
CREATE TYPE "GameKey" AS ENUM ('memory_matrix', 'target_watch', 'quick_match', 'stop_signal', 'rule_switch');

-- CreateEnum
CREATE TYPE "GameRunStatus" AS ENUM ('pending', 'in_progress', 'completed', 'interrupted');

-- CreateEnum
CREATE TYPE "TelemetryEventType" AS ENUM ('trial_started', 'stimulus_hidden', 'stimulus_shown', 'response', 'timeout', 'quality_flag', 'session_paused', 'session_resumed', 'session_ended');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('generating', 'ready', 'failed');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "auth_provider_id" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'parent',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "birth_month" SMALLINT NOT NULL,
    "birth_year" SMALLINT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "accessibility_json" JSON NOT NULL DEFAULT '{}',
    "status" "ChildStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "consent_type" "ConsentType" NOT NULL,
    "document_version" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "source" "ConsentSource" NOT NULL,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "assessment_version" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" "AssessmentStatus" NOT NULL DEFAULT 'pending',
    "device_context_json" JSON NOT NULL DEFAULT '{}',

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_blocks" (
    "id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "domain" "CognitiveDomain" NOT NULL,
    "task_version" TEXT NOT NULL,
    "order_index" SMALLINT NOT NULL,

    CONSTRAINT "assessment_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "planner_version" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" "TrainingSessionStatus" NOT NULL DEFAULT 'pending',
    "target_duration_sec" INTEGER NOT NULL,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_runs" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "game_key" "GameKey" NOT NULL,
    "game_version" TEXT NOT NULL,
    "configuration_json" JSON NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "status" "GameRunStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "game_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_events" (
    "id" UUID NOT NULL,
    "game_run_id" UUID NOT NULL,
    "sequence_no" INTEGER NOT NULL,
    "event_type" "TelemetryEventType" NOT NULL,
    "client_time_ms" INTEGER NOT NULL,
    "payload_json" JSON NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" UUID NOT NULL,

    CONSTRAINT "raw_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_metrics" (
    "id" UUID NOT NULL,
    "game_run_id" UUID NOT NULL,
    "metric_version" TEXT NOT NULL,
    "accuracy" DECIMAL(5,4) NOT NULL,
    "median_rt_ms" DECIMAL(10,2) NOT NULL,
    "mean_rt_ms" DECIMAL(10,2) NOT NULL,
    "rt_variability" DECIMAL(10,2) NOT NULL,
    "omission_errors" INTEGER NOT NULL,
    "commission_errors" INTEGER NOT NULL,
    "difficulty" SMALLINT NOT NULL,
    "valid_trial_count" INTEGER NOT NULL,
    "quality_flags_json" JSON NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_performance" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "domain" "CognitiveDomain" NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "algorithm_version" TEXT NOT NULL,
    "source_run_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adaptive_states" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "game_key" "GameKey" NOT NULL,
    "ability_estimate" DECIMAL(4,2) NOT NULL,
    "uncertainty" DECIMAL(4,2) NOT NULL,
    "current_difficulty" SMALLINT NOT NULL,
    "algorithm_version" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adaptive_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "planner_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "items_json" JSON NOT NULL,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "report_version" TEXT NOT NULL,
    "summary_json" JSON NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'generating',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE INDEX "child_profiles_account_id_idx" ON "child_profiles"("account_id");

-- CreateIndex
CREATE INDEX "consent_records_child_id_idx" ON "consent_records"("child_id");

-- CreateIndex
CREATE INDEX "assessments_child_id_idx" ON "assessments"("child_id");

-- CreateIndex
CREATE INDEX "assessment_blocks_assessment_id_idx" ON "assessment_blocks"("assessment_id");

-- CreateIndex
CREATE INDEX "training_sessions_child_id_started_at_idx" ON "training_sessions"("child_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "game_runs_session_id_idx" ON "game_runs"("session_id");

-- CreateIndex
CREATE INDEX "raw_events_game_run_id_idx" ON "raw_events"("game_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "raw_events_game_run_id_sequence_no_key" ON "raw_events"("game_run_id", "sequence_no");

-- CreateIndex
CREATE INDEX "task_metrics_game_run_id_idx" ON "task_metrics"("game_run_id");

-- CreateIndex
CREATE INDEX "domain_performance_child_id_domain_created_at_idx" ON "domain_performance"("child_id", "domain", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "adaptive_states_child_id_game_key_key" ON "adaptive_states"("child_id", "game_key");

-- CreateIndex
CREATE INDEX "training_plans_child_id_created_at_idx" ON "training_plans"("child_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reports_child_id_created_at_idx" ON "reports"("child_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_blocks" ADD CONSTRAINT "assessment_blocks_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_runs" ADD CONSTRAINT "game_runs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_events" ADD CONSTRAINT "raw_events_game_run_id_fkey" FOREIGN KEY ("game_run_id") REFERENCES "game_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_metrics" ADD CONSTRAINT "task_metrics_game_run_id_fkey" FOREIGN KEY ("game_run_id") REFERENCES "game_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_performance" ADD CONSTRAINT "domain_performance_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptive_states" ADD CONSTRAINT "adaptive_states_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

