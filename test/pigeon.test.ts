import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import { Template } from 'aws-cdk-lib/assertions';
import * as Pigeon from '../lib/pigeon-stack';

function getLogicalId(stack: cdk.Stack, resource: cdk.IResource) {
  return stack.getLogicalId(resource.node.findChild('Resource') as cdk.CfnElement);
}

const defaultCode = `exports.handler = async function (event, context, callback) {
  try {
    const data = {
      statusCode: 201,
    };
    return data;
  } catch (uncaughtError) {
    console.error(uncaughtError);
    throw uncaughtError;
  }
}`;

describe('Successful creation', () => {
  const app = new cdk.App();
  const maxEventAgeInMinutes = 3;
  const retryAttempts = 2;
  const testEmailAddress = 'test@test.com';
  const basicProps = {
    schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
    lambdaFunctionProps: {
      code: lambda.Code.fromInline(defaultCode),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
    },
  };
  const alertProps = {
    ...basicProps,
    lambdaTargetProps: {
      maxEventAge: cdk.Duration.minutes(maxEventAgeInMinutes),
      retryAttempts: retryAttempts,
    },
    alertOnFailure: true,
  };
  const emailAlertProps = {
    ...alertProps,
    emailAddress: testEmailAddress,
  };

  const basicStack = new Pigeon.PigeonStack(
    app,
    'pigeon-basic-test-stack',
    basicProps,
  );

  const alertStack = new Pigeon.PigeonStack(
    app,
    'pigeon-alert-test-stack',
    alertProps
  );

  const emailAlertStack = new Pigeon.PigeonStack(
    app,
    'pigeon-email-alert-test-stack',
    emailAlertProps
  );

  test('Basic resources are created', () => {
    const template = Template.fromStack(basicStack);

    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs14.x',
    });
    const lambdaLogicalId = getLogicalId(
      basicStack,
      basicStack.pigeon.lambdaFunction,
    );
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'rate(5 minutes)',
      State: "ENABLED",
      Targets: [
        {
          Arn: {
            'Fn::GetAtt': [
              lambdaLogicalId,
              'Arn',
            ],
          }
        },
      ],
    });
  });

  test('SNS Topic alerts on failure and more complicated props', () => {
    const template = Template.fromStack(alertStack);

    if (!alertStack.pigeon.topic) {
      throw new Error('Missing topic in alert stack.');
    }
    const lambdaLogicalId = getLogicalId(
      alertStack,
      alertStack.pigeon.lambdaFunction,
    );
    const snsTopicLogicalId = getLogicalId(
      alertStack,
      alertStack.pigeon.topic,
    );
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs14.x',
    });
    template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
      MaximumEventAgeInSeconds: maxEventAgeInMinutes * 60,
      MaximumRetryAttempts: retryAttempts,
    });
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'rate(5 minutes)',
      State: "ENABLED",
      Targets: [
        {
          Arn: {
            'Fn::GetAtt': [
              lambdaLogicalId,
              'Arn',
            ],
          }
        },
      ],
    });
    template.hasResourceProperties('AWS::SNS::Topic', {});
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      ComparisonOperator: 'GreaterThanThreshold',
      EvaluationPeriods: 1,
      AlarmActions: [
        {
          Ref: snsTopicLogicalId,
        }
      ],
      Dimensions: [
        {
          Name: 'FunctionName',
          Value: {
            Ref: lambdaLogicalId,
          }
        },
      ],
      MetricName: 'Errors',
      Namespace: 'AWS/Lambda',
      Period: 300,
      Statistic: 'Sum',
      Threshold: 1,
    });
  });

  test('Email alerts', () => {
    const template = Template.fromStack(emailAlertStack);

    if (!emailAlertStack.pigeon.topic) {
      throw new Error('Missing topic in alert stack.');
    }
    const snsTopicLogicalId = getLogicalId(
      emailAlertStack,
      emailAlertStack.pigeon.topic,
    );
    template.hasResourceProperties('AWS::SNS::Subscription', {
      TopicArn: {
        Ref: snsTopicLogicalId,
      },
      Protocol: 'email-json',
      Endpoint: testEmailAddress,
    });
  });
});
