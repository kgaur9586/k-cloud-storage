-- Add size column to folders table for tracking folder sizes
ALTER TABLE folders ADD COLUMN IF NOT EXISTS size BIGINT DEFAULT 0;

-- Create index for faster queries on folder size
CREATE INDEX IF NOT EXISTS idx_folders_size ON folders(size);

-- Add comment
COMMENT ON COLUMN folders.size IS 'Total size of all files in folder and subfolders (bytes)';
