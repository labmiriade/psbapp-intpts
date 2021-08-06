import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import { CustomResource, Duration, Stack } from '@aws-cdk/core';
import * as cr from '@aws-cdk/custom-resources/lib';
import * as cdk from '@aws-cdk/core';

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
}

export class ConfigWriterConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ConfigWriterProps) {
    super(scope, id);

    new CustomResource(this, 'Resource', {
      serviceToken: ConfigWriterProvider.getOrCreate(this),
      resourceType: 'Custom::ConfigWriter',
      properties: {
        BucketName: props.bucket.bucketName,
        ObjectKey: props.objectKey,
        BaseUrl: props.baseUrl,
        AwsRegion: props.awsRegion,
        AwsIdentityPoolId: props.awsIdentityPoolId,
        AwsMapName: props.awsMapName,
      },
    });
  }
}

class ConfigWriterProvider extends cdk.Construct {
  /**
   * Returns the singleton provider.
   */
  public static getOrCreate(scope: cdk.Construct) {
    const providerId = 'com.amazonaws.cdk.custom-resources.config-writer';
    const stack = Stack.of(scope);
    const group =
      (stack.node.tryFindChild(providerId) as ConfigWriterProvider) || new ConfigWriterProvider(stack, providerId);
    return group.provider.serviceToken;
  }

  private readonly provider: cr.Provider;

  constructor(scope: cdk.Construct, id: string) {
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
      totalTimeout: Duration.minutes(5),
    });
  }
}
