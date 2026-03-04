-- CreateTable
CREATE TABLE "member" (
    "id" SERIAL NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "name" TEXT,
    "display_name" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "birth" TEXT,
    "point" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3),
    "is_oauth" BOOLEAN,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "consecutive_achieve_count" INTEGER NOT NULL DEFAULT 0,
    "premium_price" INTEGER NOT NULL DEFAULT 9999,
    "total_achieved_time" INTEGER NOT NULL DEFAULT 0,
    "total_account_balance" INTEGER NOT NULL DEFAULT 0,
    "weekly_routine_time" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_link_app" (
    "id" SERIAL NOT NULL,
    "link_app" TEXT,
    "member_id" INTEGER,

    CONSTRAINT "member_link_app_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_account" (
    "id" SERIAL NOT NULL,
    "oauth_id" TEXT,
    "provider" TEXT,
    "created_at" TIMESTAMP(3),
    "member_id" INTEGER,

    CONSTRAINT "oauth_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "time" INTEGER,
    "duration" INTEGER,
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "is_ended" BOOLEAN NOT NULL DEFAULT false,
    "is_extended" BOOLEAN NOT NULL DEFAULT false,
    "is_valid" BOOLEAN NOT NULL DEFAULT false,
    "interest" DOUBLE PRECISION,
    "interest_balance" BIGINT NOT NULL DEFAULT 0,
    "created_at" DATE,
    "expired_at" DATE,
    "updated_at" TIMESTAMP(3),
    "member_id" INTEGER,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_log" (
    "id" SERIAL NOT NULL,
    "deposit_time" INTEGER,
    "balance" INTEGER,
    "created_at" TIMESTAMP(3),
    "account_id" INTEGER,

    CONSTRAINT "account_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interest_log" (
    "id" SERIAL NOT NULL,
    "target_year_month" TEXT,
    "interest" INTEGER,
    "account_id" INTEGER,

    CONSTRAINT "interest_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "duration" BIGINT,
    "created_at" TIMESTAMP(3),
    "is_suspended" BOOLEAN NOT NULL DEFAULT false,
    "is_achieved" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_ended" BOOLEAN NOT NULL DEFAULT false,
    "is_ai_routine" BOOLEAN,
    "member_id" INTEGER,
    "account_id" INTEGER,

    CONSTRAINT "routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_day" (
    "id" SERIAL NOT NULL,
    "day" TEXT,
    "routine_id" INTEGER,

    CONSTRAINT "routine_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_log" (
    "id" SERIAL NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration" BIGINT,
    "is_completed" BOOLEAN,
    "routine_id" INTEGER,

    CONSTRAINT "routine_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "category" TEXT,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "duration" BIGINT,
    "link_app" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "routine_id" INTEGER,

    CONSTRAINT "todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_log" (
    "id" SERIAL NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration" BIGINT,
    "is_completed" BOOLEAN,
    "todo_id" INTEGER,
    "routine_log_id" INTEGER,

    CONSTRAINT "todo_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_time" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "start_time" TEXT,
    "end_time" TEXT,
    "duration" BIGINT,
    "member_id" INTEGER,

    CONSTRAINT "spare_time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_time_day" (
    "id" SERIAL NOT NULL,
    "day" TEXT,
    "spare_time_id" INTEGER,

    CONSTRAINT "spare_time_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey" (
    "id" SERIAL NOT NULL,
    "spare_tpo" TEXT,
    "preference1" TEXT,
    "preference2" TEXT,
    "preference3" TEXT,
    "extra_request" TEXT,
    "member_id" INTEGER,

    CONSTRAINT "survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_like_option" (
    "id" SERIAL NOT NULL,
    "like_option" TEXT,
    "survey_id" INTEGER,

    CONSTRAINT "survey_like_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_spare_time" (
    "id" SERIAL NOT NULL,
    "spare_time" TEXT,
    "survey_id" INTEGER,

    CONSTRAINT "survey_spare_time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3),
    "member_id" INTEGER,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_achieve" (
    "id" SERIAL NOT NULL,
    "date" DATE,
    "status" TEXT,
    "member_id" INTEGER,

    CONSTRAINT "daily_achieve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fcm_token" (
    "id" SERIAL NOT NULL,
    "fcm_token" TEXT,
    "active" BOOLEAN,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "member_id" INTEGER,

    CONSTRAINT "fcm_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_log" (
    "id" SERIAL NOT NULL,
    "point" INTEGER,
    "balance" INTEGER,
    "category" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3),
    "member_id" INTEGER,

    CONSTRAINT "point_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premium" (
    "id" SERIAL NOT NULL,
    "start_at" DATE,
    "end_at" DATE,
    "member_id" INTEGER,

    CONSTRAINT "premium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_user_report" (
    "id" SERIAL NOT NULL,
    "target_year_month" TEXT,
    "total_accumulated_time" BIGINT,
    "average_accumulated_time" BIGINT,
    "member_id" INTEGER,

    CONSTRAINT "monthly_user_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snow_card" (
    "id" SERIAL NOT NULL,
    "target_year_month" TEXT,
    "snow_card" TEXT,
    "member_id" INTEGER,

    CONSTRAINT "snow_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" SERIAL NOT NULL,
    "username" TEXT,
    "refresh_token" TEXT,
    "expired_at" TIMESTAMP(3),

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "survey_member_id_key" ON "survey"("member_id");

-- AddForeignKey
ALTER TABLE "member_link_app" ADD CONSTRAINT "member_link_app_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_account" ADD CONSTRAINT "oauth_account_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_log" ADD CONSTRAINT "account_log_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interest_log" ADD CONSTRAINT "interest_log_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine" ADD CONSTRAINT "routine_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine" ADD CONSTRAINT "routine_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_day" ADD CONSTRAINT "routine_day_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_log" ADD CONSTRAINT "routine_log_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todo" ADD CONSTRAINT "todo_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todo_log" ADD CONSTRAINT "todo_log_todo_id_fkey" FOREIGN KEY ("todo_id") REFERENCES "todo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todo_log" ADD CONSTRAINT "todo_log_routine_log_id_fkey" FOREIGN KEY ("routine_log_id") REFERENCES "routine_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_time" ADD CONSTRAINT "spare_time_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_time_day" ADD CONSTRAINT "spare_time_day_spare_time_id_fkey" FOREIGN KEY ("spare_time_id") REFERENCES "spare_time"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey" ADD CONSTRAINT "survey_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_like_option" ADD CONSTRAINT "survey_like_option_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_spare_time" ADD CONSTRAINT "survey_spare_time_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_achieve" ADD CONSTRAINT "daily_achieve_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fcm_token" ADD CONSTRAINT "fcm_token_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_log" ADD CONSTRAINT "point_log_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium" ADD CONSTRAINT "premium_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_user_report" ADD CONSTRAINT "monthly_user_report_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snow_card" ADD CONSTRAINT "snow_card_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
