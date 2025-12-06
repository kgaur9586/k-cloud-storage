-- Create shared_links table for file/folder sharing
-- Supports password protection, expiration, access limits, and permission levels

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS shared_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type VARCHAR(10) NOT NULL CHECK (resource_type IN ('file', 'folder')),
  resource_id UUID NOT NULL,
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES users(id) ON DELETE CASCADE, -- null for public links
  share_token VARCHAR(64) UNIQUE NOT NULL,
  permission VARCHAR(20) NOT NULL CHECK (permission IN ('view', 'download', 'edit')),
  password_hash VARCHAR(255),
  expires_at TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  max_access_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_shared_links_token ON shared_links(share_token);
CREATE INDEX idx_shared_links_resource ON shared_links(resource_type, resource_id);
CREATE INDEX idx_shared_links_shared_by ON shared_links(shared_by);
CREATE INDEX idx_shared_links_shared_with ON shared_links(shared_with);
CREATE INDEX idx_shared_links_active ON shared_links(is_active) WHERE is_active = true;

-- Add foreign key constraints for files and folders
-- Note: These are soft constraints since resource_id can point to either files or folders
-- We'll enforce this in application logic

COMMENT ON TABLE shared_links IS 'Stores share links for files and folders with permissions and access controls';
COMMENT ON COLUMN shared_links.resource_type IS 'Type of resource being shared: file or folder';
COMMENT ON COLUMN shared_links.share_token IS 'Unique token for accessing the shared resource';
COMMENT ON COLUMN shared_links.permission IS 'Permission level: view (preview only), download (view + download), edit (view + download + upload new version)';
COMMENT ON COLUMN shared_links.password_hash IS 'Bcrypt hash of password if password protection is enabled';
COMMENT ON COLUMN shared_links.expires_at IS 'Expiration timestamp, null for never expires';
COMMENT ON COLUMN shared_links.access_count IS 'Number of times this link has been accessed';
COMMENT ON COLUMN shared_links.max_access_count IS 'Maximum number of accesses allowed, null for unlimited';
