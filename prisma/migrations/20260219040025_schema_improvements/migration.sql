/*
  Warnings:

  - You are about to drop the `todo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `todo_log` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `member_id` on table `account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `account_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `account_id` on table `account_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `member_id` on table `category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `member_id` on table `daily_achieve` required. This step will fail if there are existing NULL values in that column.
  - Made the column `member_id` on table `fcm_token` required. This step will fail if there are existing NULL values in that column.
  - Made the column `account_id` on table `interest_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `member_id` on table `member_link_app` required. This step will fail if there are existing NULL values in that column.
  - Made the column `member_id` on table `monthly_user_report` required. This step will fail if there are existing NULL values in that column.
  - Made the column `member_id` on table `oauth_account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `point_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `member_id` on table `point_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `member_id` on table `premium` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `member_id` to the `refresh_token` table without a default value. This is not possible if the table is not empty.
  - Made the column `member_id` on table `routine` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `day` to the `routine_day` table without a default value. This is not possible if the table is not empty.
  - Made the column `routine_id` on table `routine_day` required. This step will fail if there are existing NULL values in that column.
  - Made the column `routine_id` on table `routine_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `member_id` on table `snow_card` required. This step will fail if there are existing NULL values in that column.
  - Made the column `member_id` on table `spare_time` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `day` to the `spare_time_day` table without a default value. This is not possible if the table is not empty.
  - Made the column `spare_time_id` on table `spare_time_day` required. This step will fail if there are existing NULL values in that column.
  - Made the column `member_id` on table `survey` required. This step will fail if there are existing NULL values in that column.
  - Made the column `survey_id` on table `survey_like_option` required. This step will fail if there are existing NULL values in that column.
  - Made the column `survey_id` on table `survey_spare_time` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_member_id_fkey";

-- DropForeignKey
ALTER TABLE "account_log" DROP CONSTRAINT "account_log_account_id_fkey";

-- DropForeignKey
ALTER TABLE "category" DROP CONSTRAINT "category_member_id_fkey";

-- DropForeignKey
ALTER TABLE "daily_achieve" DROP CONSTRAINT "daily_achieve_member_id_fkey";

-- DropForeignKey
ALTER TABLE "fcm_token" DROP CONSTRAINT "fcm_token_member_id_fkey";

-- DropForeignKey
ALTER TABLE "interest_log" DROP CONSTRAINT "interest_log_account_id_fkey";

-- DropForeignKey
ALTER TABLE "member_link_app" DROP CONSTRAINT "member_link_app_member_id_fkey";

-- DropForeignKey
ALTER TABLE "monthly_user_report" DROP CONSTRAINT "monthly_user_report_member_id_fkey";

-- DropForeignKey
ALTER TABLE "oauth_account" DROP CONSTRAINT "oauth_account_member_id_fkey";

-- DropForeignKey
ALTER TABLE "point_log" DROP CONSTRAINT "point_log_member_id_fkey";

-- DropForeignKey
ALTER TABLE "premium" DROP CONSTRAINT "premium_member_id_fkey";

-- DropForeignKey
ALTER TABLE "routine" DROP CONSTRAINT "routine_member_id_fkey";

-- DropForeignKey
ALTER TABLE "routine_day" DROP CONSTRAINT "routine_day_routine_id_fkey";

-- DropForeignKey
ALTER TABLE "routine_log" DROP CONSTRAINT "routine_log_routine_id_fkey";

-- DropForeignKey
ALTER TABLE "snow_card" DROP CONSTRAINT "snow_card_member_id_fkey";

-- DropForeignKey
ALTER TABLE "spare_time" DROP CONSTRAINT "spare_time_member_id_fkey";

-- DropForeignKey
ALTER TABLE "spare_time_day" DROP CONSTRAINT "spare_time_day_spare_time_id_fkey";

-- DropForeignKey
ALTER TABLE "survey" DROP CONSTRAINT "survey_member_id_fkey";

-- DropForeignKey
ALTER TABLE "survey_like_option" DROP CONSTRAINT "survey_like_option_survey_id_fkey";

-- DropForeignKey
ALTER TABLE "survey_spare_time" DROP CONSTRAINT "survey_spare_time_survey_id_fkey";

-- DropForeignKey
ALTER TABLE "todo" DROP CONSTRAINT "todo_routine_id_fkey";

-- DropForeignKey
ALTER TABLE "todo_log" DROP CONSTRAINT "todo_log_routine_log_id_fkey";

-- DropForeignKey
ALTER TABLE "todo_log" DROP CONSTRAINT "todo_log_todo_id_fkey";

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "account_log" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "account_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "category" ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "daily_achieve" ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "fcm_token" ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "interest_log" ALTER COLUMN "account_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "member_link_app" ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "monthly_user_report" ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "oauth_account" ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "point_log" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "premium" ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "refresh_token" ADD COLUMN     "member_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "routine" ADD COLUMN     "link_app" TEXT,
ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "routine_day" DROP COLUMN "day",
ADD COLUMN     "day" "DayOfWeek" NOT NULL,
ALTER COLUMN "routine_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "routine_log" ALTER COLUMN "routine_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "snow_card" ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "spare_time" ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "spare_time_day" DROP COLUMN "day",
ADD COLUMN     "day" "DayOfWeek" NOT NULL,
ALTER COLUMN "spare_time_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "survey" ALTER COLUMN "member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "survey_like_option" ALTER COLUMN "survey_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "survey_spare_time" ALTER COLUMN "survey_id" SET NOT NULL;

-- DropTable
DROP TABLE "todo";

-- DropTable
DROP TABLE "todo_log";

-- CreateIndex
CREATE INDEX "account_member_id_idx" ON "account"("member_id");

-- CreateIndex
CREATE INDEX "account_log_account_id_idx" ON "account_log"("account_id");

-- CreateIndex
CREATE INDEX "category_member_id_idx" ON "category"("member_id");

-- CreateIndex
CREATE INDEX "daily_achieve_member_id_idx" ON "daily_achieve"("member_id");

-- CreateIndex
CREATE INDEX "daily_achieve_member_id_date_idx" ON "daily_achieve"("member_id", "date");

-- CreateIndex
CREATE INDEX "fcm_token_member_id_idx" ON "fcm_token"("member_id");

-- CreateIndex
CREATE INDEX "interest_log_account_id_idx" ON "interest_log"("account_id");

-- CreateIndex
CREATE INDEX "member_link_app_member_id_idx" ON "member_link_app"("member_id");

-- CreateIndex
CREATE INDEX "monthly_user_report_member_id_idx" ON "monthly_user_report"("member_id");

-- CreateIndex
CREATE INDEX "oauth_account_member_id_idx" ON "oauth_account"("member_id");

-- CreateIndex
CREATE INDEX "point_log_member_id_idx" ON "point_log"("member_id");

-- CreateIndex
CREATE INDEX "point_log_member_id_created_at_idx" ON "point_log"("member_id", "created_at");

-- CreateIndex
CREATE INDEX "premium_member_id_idx" ON "premium"("member_id");

-- CreateIndex
CREATE INDEX "refresh_token_member_id_idx" ON "refresh_token"("member_id");

-- CreateIndex
CREATE INDEX "routine_member_id_idx" ON "routine"("member_id");

-- CreateIndex
CREATE INDEX "routine_account_id_idx" ON "routine"("account_id");

-- CreateIndex
CREATE INDEX "routine_day_routine_id_idx" ON "routine_day"("routine_id");

-- CreateIndex
CREATE INDEX "routine_log_routine_id_idx" ON "routine_log"("routine_id");

-- CreateIndex
CREATE INDEX "snow_card_member_id_idx" ON "snow_card"("member_id");

-- CreateIndex
CREATE INDEX "spare_time_member_id_idx" ON "spare_time"("member_id");

-- CreateIndex
CREATE INDEX "spare_time_day_spare_time_id_idx" ON "spare_time_day"("spare_time_id");

-- CreateIndex
CREATE INDEX "survey_like_option_survey_id_idx" ON "survey_like_option"("survey_id");

-- CreateIndex
CREATE INDEX "survey_spare_time_survey_id_idx" ON "survey_spare_time"("survey_id");

-- AddForeignKey
ALTER TABLE "member_link_app" ADD CONSTRAINT "member_link_app_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_account" ADD CONSTRAINT "oauth_account_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_log" ADD CONSTRAINT "account_log_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interest_log" ADD CONSTRAINT "interest_log_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine" ADD CONSTRAINT "routine_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_day" ADD CONSTRAINT "routine_day_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_log" ADD CONSTRAINT "routine_log_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_time" ADD CONSTRAINT "spare_time_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_time_day" ADD CONSTRAINT "spare_time_day_spare_time_id_fkey" FOREIGN KEY ("spare_time_id") REFERENCES "spare_time"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey" ADD CONSTRAINT "survey_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_like_option" ADD CONSTRAINT "survey_like_option_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_spare_time" ADD CONSTRAINT "survey_spare_time_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_achieve" ADD CONSTRAINT "daily_achieve_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fcm_token" ADD CONSTRAINT "fcm_token_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_log" ADD CONSTRAINT "point_log_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium" ADD CONSTRAINT "premium_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_user_report" ADD CONSTRAINT "monthly_user_report_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snow_card" ADD CONSTRAINT "snow_card_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
