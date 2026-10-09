# 08 · CloudFormation: a small stack

**Skills:** infrastructure as code, templates (`Parameters`, `Resources`,
`Outputs`), intrinsic functions (`!Ref`, `!GetAtt`, `!Sub`), stacks, create
vs update, rollbacks.

## Background
So far you've created resources one SDK call at a time. **CloudFormation**
lets you *declare* them in a template. You hand it the template and it works
out the calls, the order and the dependencies. The set of resources it
manages is a **stack**: update the template and redeploy to change it, or
delete the stack and everything in it goes too. If a create fails, it **rolls
back**.

```yaml
Parameters:          # inputs, e.g. which environment
  Env: { Type: String, Default: dev }
Resources:           # what to create, by logical id
  Things:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub app-${Env}-things   # !Sub: string interpolation
Outputs:             # values to show or export
  ThingsArn:
    Value: !GetAtt Things.Arn             # !GetAtt: an attribute of a resource
```

`!Ref X` returns a resource's main identifier. Which one depends on the type:
a bucket's name, a queue's **URL**, a parameter's name. Referencing another
resource also tells CloudFormation to create that resource first.

Terraform and the CDK do the same job. The CDK actually *generates*
CloudFormation templates.

## Goal
Finish `template.yaml` (the three TODOs), then deploy it with
`node deploy.mjs`:

1. **`JobsQueue`**: an SQS queue named `onboard-cfn-<Env>-jobs`, visibility
   timeout 60.
2. **`QueueUrlParam`**: an SSM parameter `/onboard/<Env>/jobs-queue-url`
   (`String`) holding the queue's URL, taken from the queue, not typed in.
3. Outputs **`QueueUrl`** and **`QueueArn`**.

Deploy with the default `Env` (`dev`). The validator checks the stack, the
real resources it made, and the template it was deployed with.

## Hints
- Indentation is meaningful in YAML. Copy `AssetsBucket` and adapt it.
- `!Sub onboard-cfn-${Env}-jobs`, `!Ref JobsQueue` (URL), `!GetAtt JobsQueue.Arn`.
- Change something and re-run `node deploy.mjs` to see an update. Break the
  template (e.g. a bad `Type`) to see the failure reason and the rollback.
- The stack's resources, events and outputs are all queryable:
  `DescribeStackResources`, `DescribeStackEvents`, `DescribeStacks`.

## Check your work
```
./onboard validate aws/08
```
