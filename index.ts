import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export interface PigeonProps {
  readonly schedule: events.Schedule,
  readonly lambdaFunctionProps: lambda.FunctionProps,
  /**
   * Let the user pass this in because timing is
   * highly dependent on the schedule.
   * Example:
   * {
   *   deadLetterQueue: queue,
   *   maxEventAge: cdk.Duration.minutes(1),
   *   retryAttempts: 2,
   * }
   */
  readonly lambdaTargetProps?: targets.LambdaFunctionProps,
  /**
   * User can do this on their own or let pigeon handle it.
   * Flipping this switch only turns on SNS alerting.
   * Use emailAddress for an actual notification.
   */
  readonly alertOnFailure?: boolean,
  /**
   * Let the user pass this in because timing and eval periods
   * are highly dependent on the schedule.
   */
  readonly lambdaMetricProps?: cloudwatch.MetricProps,
  readonly emailAddress?: string,
}

export class Pigeon extends Construct {
  public lambdaFunction!: lambda.Function;
  public topic?: sns.Topic;

  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope: Construct, id: string, props: PigeonProps) {
    super(scope, id);

    const {
      schedule,
      lambdaFunctionProps,
      lambdaTargetProps,
      alertOnFailure = false,
      lambdaMetricProps,
      emailAddress,
    } = props;

    const rule = new events.Rule(this, `${id}-rule`, {
      schedule,
    });
    const lambdaFunction = new lambda.Function(
      this,
      `${id}-function`,
      lambdaFunctionProps,
    );
    this.lambdaFunction = lambdaFunction;
    rule.addTarget(
      new targets.LambdaFunction(lambdaFunction, lambdaTargetProps),
    );

    if (alertOnFailure) {
      const alarm = new cloudwatch.Alarm(
        this,
        `${id}-alarm`,
        {
          comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          threshold: 1,
          evaluationPeriods: 1,
          metric: lambdaFunction.metricErrors(lambdaMetricProps),
        },
      );
      const topic = new sns.Topic(this, `${id}-topic`);
      alarm.addAlarmAction(new cloudwatchActions.SnsAction(topic));

      if (emailAddress) {
        topic.addSubscription(
          new snsSubscriptions.EmailSubscription(emailAddress),
        );
      }
    }
  }
}