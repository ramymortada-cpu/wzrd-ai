-- Sprint F: Brand Monitor — per-client schedule + last run for observatory worker
ALTER TABLE clients
  ADD COLUMN brand_monitor_enabled INT NOT NULL DEFAULT 0 COMMENT '1 = run scheduled observatory scans',
  ADD COLUMN brand_monitor_interval_days INT NOT NULL DEFAULT 7 COMMENT 'Minimum days between automatic scans',
  ADD COLUMN brand_monitor_last_run_at TIMESTAMP NULL DEFAULT NULL COMMENT 'UTC last observatory run';
