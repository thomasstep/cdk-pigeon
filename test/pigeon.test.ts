import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Template } from 'aws-cdk-lib/assertions';
import * as Pigeon from '../lib/pigeon-stack';

describe('Successful creation', () => {
  const app = new cdk.App();
  const stack = new Pigeon.PigeonStack(app, 'MyTestStack', {
    pigeonProps: {},
  });
  const template = Template.fromStack(stack);
});
