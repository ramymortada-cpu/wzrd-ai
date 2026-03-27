-- Sprint A — The Acquisition Engine (SEO Blog & Lead Magnets)
-- Adds blog_posts (SEO content) and free_reports (lead magnet output).

CREATE TABLE `blog_posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) NOT NULL,
  `title` varchar(500) NOT NULL,
  `excerpt` text,
  `content` text NOT NULL,
  `coverImage` text,
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `seoTitle` varchar(500) DEFAULT NULL,
  `seoDescription` varchar(1000) DEFAULT NULL,
  `seoKeywords` varchar(1000) DEFAULT NULL,
  `publishedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_posts_slug_unique` (`slug`)
);

CREATE TABLE `free_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `industry` varchar(255) NOT NULL,
  `reportContent` text,
  `status` enum('generating','ready','failed') NOT NULL DEFAULT 'generating',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `free_reports_leadId_idx` (`leadId`)
);

