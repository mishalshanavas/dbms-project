-- Create custom ENUM types for statuses and item types (CockroachDB compatible)
CREATE TYPE IF NOT EXISTS "public"."claim_status" AS ENUM('pending', 'accepted', 'rejected');
CREATE TYPE IF NOT EXISTS "public"."item_status" AS ENUM('open', 'claimed', 'resolved', 'closed');
CREATE TYPE IF NOT EXISTS "public"."item_type" AS ENUM('lost', 'found');

-- Create the 'users' table to store user information
CREATE TABLE IF NOT EXISTS "users" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "google_id" varchar(255) NOT NULL UNIQUE,
 "email" varchar(255) NOT NULL UNIQUE,
 "name" varchar(255) NOT NULL,
 "avatar" text,
 "phone" varchar(30),
 "is_admin" boolean DEFAULT false NOT NULL,
 "created_at" timestamp DEFAULT now() NOT NULL,
 "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create the 'categories' table for item categories
CREATE TABLE IF NOT EXISTS "categories" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "name" varchar(100) NOT NULL UNIQUE,
 "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create the 'locations' table for campus locations
CREATE TABLE IF NOT EXISTS "locations" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "name" varchar(255) NOT NULL UNIQUE,
 "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create the 'items' table for lost and found listings
CREATE TABLE IF NOT EXISTS "items" (
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
 "updated_at" timestamp DEFAULT now() NOT NULL,
 -- Constraints
 CONSTRAINT "items_title_length_check" CHECK (char_length(title) > 3),
 CONSTRAINT "fk_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT,
 CONSTRAINT "fk_location" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT,
 CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create the 'item_images' table to store optional photos for items
CREATE TABLE IF NOT EXISTS "item_images" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "item_id" uuid NOT NULL UNIQUE,
 "image_data" text NOT NULL,
 "mime_type" varchar(100) NOT NULL,
 "created_at" timestamp DEFAULT now() NOT NULL,
 -- Constraint
 CONSTRAINT "fk_item_image" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE
);

-- Create the 'rewards' table for optional rewards on items
CREATE TABLE IF NOT EXISTS "rewards" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "item_id" uuid NOT NULL UNIQUE,
 "description" varchar(255) NOT NULL,
 "created_at" timestamp DEFAULT now() NOT NULL,
 -- Constraint
 CONSTRAINT "fk_item_reward" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE
);

-- Create the 'claims' table for users to claim items
CREATE TABLE IF NOT EXISTS "claims" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "item_id" uuid NOT NULL,
 "claimer_id" uuid NOT NULL,
 "message" text NOT NULL,
 "status" "claim_status" DEFAULT 'pending' NOT NULL,
 "created_at" timestamp DEFAULT now() NOT NULL,
 -- Constraints
 CONSTRAINT "claims_item_claimer_unique" UNIQUE ("item_id", "claimer_id"),
 CONSTRAINT "fk_item_claim" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE,
 CONSTRAINT "fk_claimer" FOREIGN KEY ("claimer_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Trigger to automatically update the 'updated_at' timestamp on items table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- CockroachDB compatible trigger creation
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- View 1: Comprehensive Item Details
CREATE OR REPLACE VIEW v_item_details AS
SELECT
    i.id AS item_id,
    i.title,
    i.description,
    i.type AS item_type,
    i.status AS item_status,
    i.date AS lost_found_date,
    c.name AS category_name,
    l.name AS location_name,
    u.name AS owner_name,
    u.email AS owner_email,
    i.created_at,
    i.updated_at
FROM
    items i
JOIN
    users u ON i.user_id = u.id
JOIN
    categories c ON i.category_id = c.id
JOIN
    locations l ON i.location_id = l.id;

-- View 2: Detailed Claim Information
CREATE OR REPLACE VIEW v_claim_details AS
SELECT
    c.id AS claim_id,
    c.status AS claim_status,
    c.message AS claim_message,
    c.created_at AS claim_date,
    i.title AS item_title,
    i.type AS item_type,
    u_claimer.name AS claimer_name,
    u_claimer.email AS claimer_email,
    u_owner.name AS owner_name
FROM
    claims c
JOIN
    items i ON c.item_id = i.id
JOIN
    users u_claimer ON c.claimer_id = u_claimer.id
JOIN
    users u_owner ON i.user_id = u_owner.id;