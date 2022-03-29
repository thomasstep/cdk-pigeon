import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Pigeon, PigeonProps } from "../index";

export class PigeonStack extends Stack {
  pigeon: Pigeon;

  constructor(scope: Construct, id: string, props: PigeonProps) {
    super(scope, id);

    const pigeon = new Pigeon(this, 'pigeon-test', {
      ...props,
    });

    this.pigeon = pigeon;
  }
}