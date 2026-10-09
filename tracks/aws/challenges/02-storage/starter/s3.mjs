// Run with: node s3.mjs   (safe to run again: make each step cope with "already exists")
import { readFileSync, writeFileSync } from 'node:fs';
import {
  S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand, ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './aws.mjs';

const s3 = new S3Client(config);
const Bucket = 'onboard-receipts';

// 1. Create the bucket.

// 2. Upload receipt.json as receipts/2026/001.json, with ContentType application/json.

// 3. Upload two more receipts under receipts/2026/ (any JSON you like).

// 4. List the keys under the receipts/2026/ prefix and print them.

// 5. Make a presigned GET URL for receipts/2026/001.json that expires in 15 minutes.
//    Print it and save it to presigned-url.txt.
