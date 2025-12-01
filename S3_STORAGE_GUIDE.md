# S3 Storage Implementation - Usage Guide

## Overview
The storage system now supports both **local filesystem** and **AWS S3** storage, selectable via environment variable.

## Configuration

### Using Local Storage (Default)
```bash
STORAGE_PROVIDER=local
```
No additional configuration needed. Files are stored in `backend/data/files/`.

### Using S3 Storage
```bash
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET=your-bucket-name
```

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Update your `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env and set STORAGE_PROVIDER=s3 (if using S3)
   # Add your AWS credentials
   ```

3. **Restart the backend server:**
   ```bash
   npm run dev
   ```

## Architecture

### Strategy Pattern
The implementation uses the Strategy pattern for clean abstraction:

```
IStorageProvider (Interface)
    ├── LocalStorageProvider (Local filesystem)
    └── S3StorageProvider (AWS S3)

StorageProviderFactory (Factory)
    └── Creates provider based on STORAGE_PROVIDER env var

StorageService (Facade)
    └── Uses the selected provider
```

### File Structure
```
backend/src/
├── storage/
│   ├── IStorageProvider.ts          # Interface
│   ├── LocalStorageProvider.ts      # Local implementation
│   ├── S3StorageProvider.ts         # S3 implementation
│   └── StorageProviderFactory.ts    # Factory
└── services/
    └── storageService.ts             # Facade (updated)
```

## Features

### Local Storage
- ✅ Stores files in `backend/data/files/{userId}/`
- ✅ Unique filename generation
- ✅ Directory management
- ✅ File stats and usage calculation

### S3 Storage
- ✅ Stores files in S3 bucket with `{userId}/{filename}` structure
- ✅ Automatic content-type detection
- ✅ Metadata preservation
- ✅ Presigned URL support (optional)
- ✅ Efficient usage calculation via pagination

## API Compatibility
**No changes required to existing code!** The `fileService` continues to work exactly as before:

```typescript
// This works with both local and S3 storage
await fileService.uploadFile(userId, buffer, filename, folderId);
await fileService.downloadFile(fileId, userId);
await fileService.deleteFile(fileId, userId);
```

## AWS S3 Setup

### 1. Create S3 Bucket
```bash
aws s3 mb s3://your-bucket-name --region us-east-1
```

### 2. Set Bucket Policy (Optional - for public read)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### 3. Create IAM User with S3 Access
Attach policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

## Testing

### Test Local Storage
```bash
STORAGE_PROVIDER=local npm run dev
# Upload a file via the UI
# Check backend/data/files/{userId}/
```

### Test S3 Storage
```bash
STORAGE_PROVIDER=s3 npm run dev
# Upload a file via the UI
# Check AWS S3 console
```

## Migration

### Local to S3
To migrate existing files from local to S3, you'll need to:
1. Write a migration script that reads from `backend/data/files/`
2. Upload each file to S3 using the S3 provider
3. Update the `path` field in the database to use S3 keys

### S3 to Local
Similar process in reverse.

## Troubleshooting

### S3 Upload Fails
- ✅ Check AWS credentials are correct
- ✅ Verify bucket exists and region matches
- ✅ Ensure IAM user has `s3:PutObject` permission
- ✅ Check bucket CORS settings if accessing from browser

### Files Not Appearing
- ✅ Check `STORAGE_PROVIDER` environment variable
- ✅ Verify logs for provider initialization message
- ✅ Check database `path` field matches storage location

## Performance Considerations

### Local Storage
- **Pros**: Fast, no network latency, no additional costs
- **Cons**: Not scalable, single point of failure, limited to server disk

### S3 Storage
- **Pros**: Scalable, durable (99.999999999%), CDN integration
- **Cons**: Network latency, costs per request/storage

## Best Practices

1. **Use S3 for production** - Better scalability and durability
2. **Use local for development** - Faster iteration, no AWS costs
3. **Enable S3 versioning** - Protect against accidental deletions
4. **Set lifecycle policies** - Automatically archive old files
5. **Monitor costs** - Set up AWS billing alerts
