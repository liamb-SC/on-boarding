// Run with: node ebs.mjs   (run it twice: it should NOT make a second volume)
import { EC2Client, CreateVolumeCommand, DescribeVolumesCommand } from '@aws-sdk/client-ec2';
import { config } from './aws.mjs';

const ec2 = new EC2Client(config);

// 1. Look for an existing volume tagged Name=onboard-data (DescribeVolumes with a
//    "tag:Name" filter).

// 2. If there isn't one, create it: 8 GiB, type gp3, in Availability Zone
//    us-east-1a, tagged Name=onboard-data (TagSpecifications).

// 3. Print its VolumeId, Size, VolumeType, AvailabilityZone and State.
