-- ═══════════════════════════════════════════
-- Migration 0014: Credits System
-- ═══════════════════════════════════════════

-- Add credits to users
ALTER TABLE users ADD COLUMN credits INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN company VARCHAR(255);
ALTER TABLE users ADD COLUMN industry VARCHAR(100);
ALTER TABLE users ADD COLUMN market VARCHAR(50);
ALTER TABLE users ADD COLUMN newsletterOptIn TINYINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN signupSource VARCHAR(50) DEFAULT 'website';

-- Credit transactions log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  amount INT NOT NULL,               -- positive = add, negative = deduct
  balance INT NOT NULL DEFAULT 0,    -- balance AFTER this transaction
  type ENUM('signup_bonus','purchase','tool_usage','refund','admin') NOT NULL,
  toolName VARCHAR(100),             -- which tool consumed credits (null for adds)
  reason VARCHAR(500),               -- human-readable reason
  metadata JSON,                     -- extra data (tool result score, purchase ID, etc.)
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

  INDEX idx_ct_userId (userId),
  INDEX idx_ct_type (type),
  INDEX idx_ct_createdAt (createdAt),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
