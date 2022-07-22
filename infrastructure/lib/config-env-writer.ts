import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ConfigWriterProps {
  /**
   * The s3 bucket to query.
   */
  readonly bucket: s3.IBucket;

  /**
   * The object key.
   */
  readonly objectKey: string;

  /**
   * The expected contents.
   */
  readonly baseUrl: string;

  readonly awsRegion: string;

  readonly awsIdentityPoolId: string;

  readonly awsMapName: string;

  readonly pinpointArn: string;
}

export class ConfigWriterConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ConfigWriterProps) {
    super(scope, id);

    new cdk.CustomResource(this, 'Resource', {
      serviceToken: ConfigWriterProvider.getOrCreate(this),
      resourceType: 'Custom::ConfigWriter',
      properties: {
        BucketName: props.bucket.bucketName,
        ObjectKey: props.objectKey,
        BaseUrl: props.baseUrl,
        AwsRegion: props.awsRegion,
        AwsIdentityPoolId: props.awsIdentityPoolId,
        AwsMapName: props.awsMapName,
        PinPointArn: props.pinpointArn,
      },
    });
  }
}

class ConfigWriterProvider extends Construct {
  /**
   * Returns the singleton provider.
   */
  public static getOrCreate(scope: Construct) {
    const providerId = 'com.amazonaws.cdk.custom-resources.config-writer';
    const stack = cdk.Stack.of(scope);
    const group =
      (stack.node.tryFindChild(providerId) as ConfigWriterProvider) || new ConfigWriterProvider(stack, providerId);
    return group.provider.serviceToken;
  }

  private readonly provider: cr.Provider;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const onEvent = new lambda.Function(this, 'configWriter-on-event', {
      code: lambda.Code.fromAsset('../config-writer/config_writer'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.on_event',
    });

    const isComplete = new lambda.Function(this, 'configWriter-is-complete', {
      code: lambda.Code.fromAsset('../config-writer/config_writer'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.is_complete',
      initialPolicy: [
        new iam.PolicyStatement({
          resources: ['*'],
          actions: ['s3:GetObject*', 's3:GetBucket*', 's3:List*', 's3:PutObject'],
        }),
      ],
    });

    this.provider = new cr.Provider(this, 'configWriter-provider', {
      onEventHandler: onEvent,
      isCompleteHandler: isComplete,
      totalTimeout: cdk.Duration.minutes(5),
    });
  }
}
