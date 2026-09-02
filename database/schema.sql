-- NFC Business Matching Database Schema
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB 10.2+
-- Primary target database: nfc_business
-- Documented/manual copy of the schema for operators and database tools.
-- backend/sql/schema.sql is the canonical runtime schema used by
-- backend/src/utils/setup-database.js. Keep this copy synchronized with it.

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `role` ENUM('admin', 'exhibitor') NOT NULL DEFAULT 'exhibitor',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `companies`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `companies` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_name` VARCHAR(255) NOT NULL,
  `company_code` VARCHAR(50) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `industry` VARCHAR(150) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `contact_name` VARCHAR(255) DEFAULT NULL,
  `contact_position` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(100) DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `logo_url` VARCHAR(500) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_companies_company_code` (`company_code`),
  KEY `idx_companies_active_name` (`is_active`, `company_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `nfc_tags`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `nfc_tags` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `tag_code` VARCHAR(100) NOT NULL,
  `public_token` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nfc_tags_tag_code` (`tag_code`),
  UNIQUE KEY `uq_nfc_tags_public_token` (`public_token`),
  KEY `idx_nfc_tags_company_id` (`company_id`),
  CONSTRAINT `fk_nfc_tags_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `company_saves`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `company_saves` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `company_id` INT UNSIGNED NOT NULL,
  `saved_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_company_saves_user_company` (`user_id`, `company_id`),
  KEY `idx_company_saves_company_id` (`company_id`),
  CONSTRAINT `fk_company_saves_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_company_saves_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `visits`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `visits` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `company_id` INT UNSIGNED NOT NULL,
  `nfc_tag_id` INT UNSIGNED DEFAULT NULL,
  `visited_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_visits_user_id` (`user_id`),
  KEY `idx_visits_company_visited` (`company_id`, `visited_at`),
  KEY `idx_visits_nfc_tag_id` (`nfc_tag_id`),
  CONSTRAINT `fk_visits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_visits_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_visits_nfc_tag` FOREIGN KEY (`nfc_tag_id`) REFERENCES `nfc_tags` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `sessions` (Optional database session store)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  `expires` INT UNSIGNED NOT NULL,
  `data` MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Visitor registration and visitor-to-company follow-up records.
CREATE TABLE IF NOT EXISTS `visitors` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `visitor_code` VARCHAR(50) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `company_name` VARCHAR(255) DEFAULT NULL,
  `job_title` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(100) DEFAULT NULL,
  `preferred_language` ENUM('en','th','ja') NOT NULL DEFAULT 'en',
  `notes` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_visitors_visitor_code` (`visitor_code`),
  KEY `idx_visitors_active_name` (`is_active`,`full_name`),
  KEY `idx_visitors_company_name` (`company_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `visitor_company_connections` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `visitor_id` INT UNSIGNED NOT NULL,
  `company_id` INT UNSIGNED NOT NULL,
  `nfc_tag_id` INT UNSIGNED DEFAULT NULL,
  `connected_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('interested','contacted','follow_up','completed','not_interested') NOT NULL DEFAULT 'interested',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_visitor_company_connections` (`visitor_id`,`company_id`),
  KEY `idx_vcc_company_connected` (`company_id`,`connected_at`),
  KEY `idx_vcc_status_connected` (`status`,`connected_at`),
  KEY `idx_vcc_nfc_tag` (`nfc_tag_id`),
  CONSTRAINT `fk_vcc_visitor` FOREIGN KEY (`visitor_id`) REFERENCES `visitors` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_vcc_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_vcc_nfc_tag` FOREIGN KEY (`nfc_tag_id`) REFERENCES `nfc_tags` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
