CREATE TYPE "public"."claim_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('open', 'claimed', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('lost', 'found');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"claimer_id" uuid NOT NULL,
	"message" text NOT NULL,
	"status" "claim_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "claims_item_id_claimer_id_unique" UNIQUE("item_id","claimer_id")
);
--> statement-breakpoint
CREATE TABLE "item_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"image_data" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "item_images_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "item_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"date" varchar(50) NOT NULL,
	"status" "item_status" DEFAULT 'open' NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "locations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"description" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rewards_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"avatar" text,
	"phone" varchar(30),
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_claimer_id_users_id_fk" FOREIGN KEY ("claimer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_images" ADD CONSTRAINT "item_images_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;