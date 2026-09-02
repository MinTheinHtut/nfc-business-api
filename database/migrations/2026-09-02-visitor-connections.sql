-- Apply manually to the nfc_business database after taking a backup.
CREATE TABLE IF NOT EXISTS visitors (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  visitor_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NULL,
  job_title VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(100) NULL,
  preferred_language ENUM('en','th','ja') NOT NULL DEFAULT 'en',
  notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_visitors_visitor_code (visitor_code),
  KEY idx_visitors_active_name (is_active, full_name),
  KEY idx_visitors_company_name (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visitor_company_connections (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  visitor_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  nfc_tag_id INT UNSIGNED NULL,
  connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('interested','contacted','follow_up','completed','not_interested') NOT NULL DEFAULT 'interested',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_visitor_company_connections (visitor_id, company_id),
  KEY idx_vcc_company_connected (company_id, connected_at),
  KEY idx_vcc_status_connected (status, connected_at),
  KEY idx_vcc_nfc_tag (nfc_tag_id),
  CONSTRAINT fk_vcc_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_vcc_company FOREIGN KEY (company_id) REFERENCES companies (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_vcc_nfc_tag FOREIGN KEY (nfc_tag_id) REFERENCES nfc_tags (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
