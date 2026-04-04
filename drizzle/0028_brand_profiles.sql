-- Sprint 5.5 Task 1: Brand Profiles — persistent brand data store
-- One row per user. Upserted on every diagnosis run.

CREATE TABLE IF NOT EXISTS `brand_profiles` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,

  -- Core identity
  `company_name` varchar(255),
  `industry` varchar(100),
  `market` varchar(50),
  `website` varchar(500),
  `social_media` varchar(500),
  `years_in_business` varchar(50),
  `team_size` varchar(50),
  `monthly_revenue` varchar(50),

  -- Positioning & audience
  `current_positioning` text,
  `target_audience` text,
  `biggest_challenge` text,
  `brand_personality` text,
  `desired_perception` text,
  `current_gap` text,
  `competitors` text,

  -- Messaging
  `tagline` varchar(500),
  `elevator_pitch` text,
  `website_headline` varchar(500),
  `instagram_bio` varchar(500),
  `linkedin_about` text,
  `tone_of_voice` varchar(50),
  `key_differentiator` text,
  `customer_quote` varchar(500),

  -- Visual identity
  `brand_colors` varchar(200),
  `has_logo` varchar(50),
  `has_guidelines` varchar(50),

  -- Offer structure
  `current_packages` text,
  `number_of_packages` varchar(50),
  `pricing_model` varchar(50),
  `cheapest_price` varchar(120),
  `highest_price` varchar(120),
  `common_objections` text,
  `competitor_pricing` text,

  -- Presence
  `instagram_handle` varchar(255),
  `instagram_followers` varchar(50),
  `other_platforms` varchar(500),
  `posting_frequency` varchar(50),
  `content_type` varchar(500),
  `inquiry_method` text,
  `avg_response_time` varchar(50),
  `google_business` varchar(50),

  -- Launch readiness
  `launch_type` varchar(50),
  `target_launch_date` varchar(50),
  `has_offer_structure` varchar(50),
  `has_website` varchar(50),
  `has_content_plan` varchar(50),
  `marketing_budget` varchar(50),
  `team_capacity` text,
  `biggest_concern` text,
  `success_metric` text,

  -- Auto-extracted data
  `auto_extracted_data` json,

  -- Metadata
  `last_tool_used` varchar(50),
  `total_diagnoses_run` int NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY `uq_brand_profiles_user` (`user_id`)
);
