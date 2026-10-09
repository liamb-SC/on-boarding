# 01 · The AWS map

**Skills:** the four big categories (compute, storage, database, networking),
and picking the right service for a job. No Docker needed for this one.

## Background
AWS has 200+ services, but most systems are built from a handful. Sort them
into four buckets and the rest gets easier:

| Category | The question it answers | Core services |
|----------|-------------------------|---------------|
| **compute** | Where does my code run? | EC2 (virtual machines you manage), Lambda (functions that run per event, no servers to manage), ECS (run Docker containers, on EC2 or serverless Fargate) |
| **storage** | Where do my files and bytes live? | S3 (objects over HTTP, unlimited), EBS (a disk for one EC2 instance), EFS (a shared network filesystem) |
| **database** | Where does my structured data live? | RDS (managed Postgres/MySQL: SQL, joins, transactions), DynamoDB (key-value/document NoSQL, fast at any scale) |
| **networking** | How do things connect, and who can reach what? | VPC (your private network), subnets (slices of it, public or private), security groups (stateful firewalls on resources), CloudFront (a CDN that caches content at edge locations) |

Rules of thumb: **Lambda** suits short, event-driven work (max 15 minutes per
run). **EC2** suits anything that needs the whole machine. **ECS** suits code
you already ship as containers. **DynamoDB** suits access patterns you know up
front. **RDS** suits data you need to query flexibly.

## Goal
Fill in `map.json`:

1. **`categories`**: for each service, one of `compute`, `storage`,
   `database` or `networking`.
2. **`scenarios`**: for each scenario below, the **one service** from the
   `categories` list that fits best (spell it as it appears there, e.g.
   `"Security group"`).

| Key | Scenario |
|-----|----------|
| `resize-on-upload` | Make a thumbnail each time someone uploads a photo. Each run takes ~2 seconds, and some days there are none. |
| `legacy-app-full-os` | A vendor's app needs a specific OS version, a kernel module and to run 24/7. |
| `run-our-containers` | The team already ships Docker images and wants AWS to run and restart them. |
| `user-uploads-at-scale` | Store millions of user-uploaded PDFs and serve them over HTTPS. |
| `disk-for-one-server` | The boot disk and data volume for a single virtual machine. |
| `shared-folder-many-servers` | Ten servers need to read and write the same directory tree at once. |
| `orders-with-joins` | Orders, customers and invoices, queried with SQL joins and transactions. |
| `session-lookups-by-key` | Look up a user session by its ID in a few milliseconds, millions of times an hour. |
| `our-private-network` | An isolated network address range (e.g. `10.0.0.0/16`) for all your resources. |
| `keep-db-off-internet` | The part of the network where the database lives, with no route from the internet. |
| `only-443-to-web-servers` | Let HTTPS (port 443) traffic reach the web servers and block everything else. |
| `fast-assets-worldwide` | Serve images and JS quickly to users in Sydney and São Paulo from one origin. |

## Hints
- Several scenarios could be built more than one way. Pick the service that is
  *designed* for the job.
- A security group sits on a resource and filters traffic. A subnet is a range
  of addresses within a VPC. "Private" means its route table has no route to
  the internet.

## Check your work
```
./onboard validate aws/01
```
