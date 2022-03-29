import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Pigeon } from "../index";

export class PigeonStack extends Stack {
  pigeon: Pigeon;

  constructor(scope: Construct, id: string, props: any) {
    super(scope, id, props);

    const {
      pigeonProps,
    } = props;

    const pigeon = new Pigeon(this, 'pigeon-test', {
      ...pigeonProps,
    });

    this.pigeon = pigeon;
  }
}