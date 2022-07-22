import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as pinpoint from 'aws-cdk-lib/aws-pinpoint';
import { Construct } from 'constructs';

export interface CoreConstructProps {
  /**
   * Whether to delete everything on removal of the stack,
   * should be false ONLY for production or other sensitive environments
   */
  destroyOnRemoval: boolean;
  /**
   * The territory interest points csv data urls
   */
  csvDataUrls: string;
  /**
   * The email to send notification alarms to
   */
  alarmEmail: string;
}

/**
 * Constract with all core resources
 */
export class CoreConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CoreConstructProps) {
    super(scope, id);

    const removalPolicy = props.destroyOnRemoval ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;

    // Data Table con tutti i dati
    const dataTable = new dynamo.Table(this, 'DataTable', {
      partitionKey: {
        name: 'pk',
        type: dynamo.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamo.AttributeType.STRING,
      },
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
      stream: dynamo.StreamViewType.NEW_IMAGE,
      removalPolicy: removalPolicy,
    });

    // Global Secondary Index per bookingId
    const indexBookingIdName = 'GSI1';
    dataTable.addGlobalSecondaryIndex({
      indexName: indexBookingIdName,
      partitionKey: {
        name: 'gsi1pk',
        type: dynamo.AttributeType.STRING,
      },
    });
    this.indexBookingIdName = indexBookingIdName;

    // default properties for lambda creation
    const defaultLambdaProps: lambda.FunctionProps = {
      code: new lambda.AssetCode('../api/search', {
        bundling: {
          image: cdk.DockerImage.fromRegistry('node:14-alpine'),
          command: ['sh', 'cdk-build.sh'],
          user: '1000',
        },
      }),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      logRetention: logs.RetentionDays.TWO_WEEKS,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        dataTable: dataTable.tableName,
      },
    };

    // lambda to import territory interest points to dynamodb
    const intPtsImportLambda = new lambda.Function(this, 'IntPtsImportFn', {
      code: new lambda.AssetCode('../etl/import-intpts', {
        bundling: {
          image: cdk.DockerImage.fromRegistry('public.ecr.aws/sam/build-python3.8:latest'),
          command: ['sh', 'cdk-build.sh'],
          user: '1000',
        },
      }),
      handler: 'main.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: cdk.Duration.seconds(120),
      memorySize: 512,
      description: 'Lambda per importare punti di interesse territoriali',
      environment: {
        DATA_TABLE: dataTable.tableName,
        CSV_DATA_URLS: props.csvDataUrls,
      },
    });
    dataTable.grantReadWriteData(intPtsImportLambda);

    const intPtsImportErrors = intPtsImportLambda.metricErrors({
      period: cdk.Duration.minutes(1),
    });

    const alarmTopic = new sns.Topic(scope, 'Alarm topic');

    alarmTopic.addSubscription(new subscriptions.EmailSubscription(props.alarmEmail));

    const importAlarm = new cloudwatch.Alarm(this, 'intPtsImportErrorsAlarm', {
      metric: intPtsImportErrors,
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
      alarmDescription: 'An error occurred during the IntPtsImport function execution',
    });

    importAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    const eventRule = new events.Rule(this, 'scheduleRule', {
      schedule: events.Schedule.cron({ minute: '0' }),
    });

    eventRule.addTarget(new targets.LambdaFunction(intPtsImportLambda));

    this.dataTable = dataTable;
    this.alarmTopicArn = alarmTopic.topicArn;

    // create aws pinpoint
    const cfnApp = new pinpoint.CfnApp(this, 'PinpointApp', {
      name: `${cdk.Stack.of(this).stackName}PinPointApp`,
      // the properties below are optional
    });
    this.pinpointArn = cfnApp.attrArn;
  }

  /**
   * The pinpoint app arn
   */
  pinpointArn: string;
  /**
   * The alarm topic arn
   */
  alarmTopicArn: string;
  /**
   * The main Table
   */
  dataTable: dynamo.Table;
  /**
   * The name of the index on the `bookingId` attribute on `dataTable`
   */
  indexBookingIdName: string;
}
