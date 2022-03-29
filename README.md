# Pigeon

This is a cheaper version of AWS Synthetics Canary. Head to my [blog post](https://thomasstep.com/blog/why-do-aws-synthetics-canaries-cost-so-much) to read more about the inspiration for this CDK Construct.

Pigeon is meant to be dead simple. It creates a Lambda Function that runs on a schedule and optionally alerts an email if the Lambda fails. Everything created is exposed, so if you want to create an alert different than the default, everything is there for you to do it.

## Props

`schedule: events.Schedule`

`lambdaFunctionProps: lambda.FunctionProps`

`lambdaTargetProps?: targets.LambdaFunctionProps`

`alertOnFailure?: boolean`

`emailAddress?: string`

## Properties

`lambdaFunction!: lambda.Function`

`rule!: events.Rule`

`alarm?: cloudwatch.Alarm`

`topic?: sns.Topic`
