# 02 · S3, and S3 vs EBS vs EFS

**Skills:** buckets, objects, keys and prefixes, `ContentType`, presigned
URLs, creating an EBS volume, and choosing between object, block and file
storage.

## Background
| | **S3** (object) | **EBS** (block) | **EFS** (file) |
|-|-----------------|-----------------|----------------|
| What it is | Objects (bytes + metadata) under keys in a bucket | A virtual disk | A shared NFS filesystem |
| How you use it | HTTP API: `PutObject`/`GetObject` | Attached to **one** EC2 instance, formatted and mounted | Mounted by **many** instances at once |
| Scope | Region (bucket names are globally unique) | **One Availability Zone** | Region (mount targets in each AZ) |
| Good for | Uploads, backups, static sites, data lakes | Boot disks, databases | Shared content, home directories |
| Price | Cheapest per GB | You pay for provisioned size | Highest per GB |

S3 has no real folders. `receipts/2026/001.json` is just a key, and
`receipts/2026/` is a **prefix** you can list by. Buckets are private by
default. To give someone temporary access to one object, you hand them a
**presigned URL**: a normal URL with a signature and an expiry baked into the
query string, made with your credentials.

## Scenario
Your sandbox runs against LocalStack (`./localstack.sh status`). `aws.mjs`
has the SDK config that points at it.

## Goal
1. **S3**: finish `s3.mjs` and run it (`node s3.mjs`):
   - create the bucket `onboard-receipts`;
   - upload `receipt.json` to `receipts/2026/001.json` with `ContentType`
     `application/json`, plus two more receipts under `receipts/2026/`;
   - list the prefix;
   - write a presigned GET URL for `receipts/2026/001.json`, valid for **15
     minutes**, to `presigned-url.txt`. Try it: `curl "$(cat presigned-url.txt)"`.
2. **EBS**: finish `ebs.mjs` and run it, twice. It should leave exactly
   **one** `gp3` volume of **8 GiB** in **`us-east-1a`**, tagged
   `Name=onboard-data`.
3. **Choose**: in `storage.json`, answer `S3`, `EBS` or `EFS` for each:

| Key | Scenario |
|-----|----------|
| `postgres-on-one-server` | Postgres on a single EC2 instance needs a low-latency disk for its data files. |
| `seven-years-of-backups` | Keep nightly database dumps for seven years, as cheaply as possible. |
| `wordpress-shared-uploads` | Four WordPress servers behind a load balancer all write to the same `uploads/` folder. |
| `static-site-files` | The HTML, CSS and JS of a static marketing site, served over HTTPS. |
| `dataset-for-a-gpu-fleet` | Twenty training servers across two AZs read the same directory of files through normal file paths. |
| `app-server-root-disk` | The operating system disk of an app server. |

## Hints
- `new PutObjectCommand({ Bucket, Key, Body, ContentType })`. `Body` can be a
  string or a Buffer.
- `getSignedUrl(s3, new GetObjectCommand({ Bucket, Key }), { expiresIn: 900 })`
  only signs, it doesn't call AWS. The expiry shows up as `X-Amz-Expires` in the
  URL.
- Creating a bucket you already own can throw `BucketAlreadyOwnedByYou`
  (us-east-1 just says OK). Catch it so the script can be re-run.
- `TagSpecifications: [{ ResourceType: 'volume', Tags: [{ Key: 'Name', Value: 'onboard-data' }] }]`
- LocalStack's free edition fakes EC2 (no real disks). It doesn't have EFS at
  all, which is why EFS only appears in the questions.
- An EBS volume can only attach to an instance **in the same AZ**. To move one,
  you snapshot it (snapshots live in S3) and create a new volume from the
  snapshot in the other AZ.

## Check your work
```
./onboard validate aws/02
```
