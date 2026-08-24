CREATE DATABASE IF NOT EXISTS nfc_business_matching CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nfc_business_matching;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  role ENUM('admin', 'exhibitor') NOT NULL DEFAULT 'exhibitor',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS companies (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_name VARCHAR(255) NOT NULL,
  company_code VARCHAR(50) NOT NULL,
  description TEXT NULL,
  industry VARCHAR(150) NULL,
  country VARCHAR(100) NULL,
  contact_name VARCHAR(255) NULL,
  contact_position VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(100) NULL,
  website VARCHAR(255) NULL,
  address TEXT NULL,
  logo_url VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_companies_company_code (company_code),
  KEY idx_companies_active_name (is_active, company_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS nfc_tags (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id INT UNSIGNED NOT NULL,
  tag_code VARCHAR(100) NOT NULL,
  public_token VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nfc_tags_tag_code (tag_code),
  UNIQUE KEY uq_nfc_tags_public_token (public_token),
  KEY idx_nfc_tags_company_id (company_id),
  CONSTRAINT fk_nfc_tags_company FOREIGN KEY (company_id) REFERENCES companies (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS company_saves (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_company_saves_user_company (user_id, company_id),
  KEY idx_company_saves_company_id (company_id),
  CONSTRAINT fk_company_saves_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_company_saves_company FOREIGN KEY (company_id) REFERENCES companies (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visits (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  company_id INT UNSIGNED NOT NULL,
  nfc_tag_id INT UNSIGNED NULL,
  visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_visits_user_id (user_id),
  KEY idx_visits_company_visited (company_id, visited_at),
  KEY idx_visits_nfc_tag_id (nfc_tag_id),
  CONSTRAINT fk_visits_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_visits_company FOREIGN KEY (company_id) REFERENCES companies (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_visits_nfc_tag FOREIGN KEY (nfc_tag_id) REFERENCES nfc_tags (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;
