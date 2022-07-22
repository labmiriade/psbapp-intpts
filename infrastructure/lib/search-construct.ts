import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as es from 'aws-cdk-lib/aws-elasticsearch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface BaseSearchConstructProps {
  /**
   * The prefix for all indices created in elasicsearch
   *
   * @example prod
   */
  indexPrefix: string;
  /**
   * If undefined a new domain will be created, otherwise the specified one
   * will be used
   *
   * @default - create the domain
   */
  reuseDomainAttributes?: es.DomainAttributes;
  /**
   * Data nodes count
   *
   * @default 2
   */
  dataNodesCount?: number;
  /**
   * Data nodes instance type
   *
   * @default t3.small.elasticsearch
   */
  dataNodeInstanceType?: string;
}

export interface SearchConstructProps extends BaseSearchConstructProps {
  /**
   * The table from which data will be replicated
   */
  sourceTable: dynamodb.Table;
  /**
   * The alarm topic arn
   */
  alarmTopicArn: string;
}

export class SearchConstruct extends Construct {
  constructor(scope: Construct, id: string, props: SearchConstructProps) {
    super(scope, id);

    // keep the ES Domain
    let domain: es.IDomain;

    if (props.reuseDomainAttributes === undefined) {
      // create the ES Domain
      const newDomain = new es.Domain(this, 'Domain', {
        version: es.ElasticsearchVersion.V7_9,
        enableVersionUpgrade: true,
        automatedSnapshotStartHour: 2,
        capacity: {
          dataNodeInstanceType: props.dataNodeInstanceType ?? 't3.small.elasticsearch',
          dataNodes: props.dataNodesCount ?? 2,
          masterNodes: 0,
        },
        ebs: {
          enabled: true,
          volumeSize: 10,
        },
        logging: {
          appLogEnabled: true,
          slowIndexLogEnabled: true,
          slowSearchLogEnabled: true,
        },
      });
      domain = newDomain;
    } else {
      // init the domain from the endpoint
      domain = es.Domain.fromDomainAttributes(this, 'Domain', {
        ...props.reuseDomainAttributes,
        domainEndpoint: `https://${props.reuseDomainAttributes.domainEndpoint}`,
      });
    }

    // create the Lambda Function to align ES from DynamoDB
    const dynamoToEsFn = new lambda.Function(this, 'dynamoToEsFn', {
      code: new lambda.AssetCode('../etl/dynamo-to-es', {
        bundling: {
          image: cdk.DockerImage.fromRegistry('public.ecr.aws/sam/build-python3.8:latest'),
          command: ['sh', 'cdk-build.sh'],
          user: '1000',
        },
      }),
      handler: 'main.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: cdk.Duration.seconds(15),
      description: 'Function to keep elasticsearch aligned with dynamoDB',
      environment: {
        ES_HOST: domain.domainEndpoint,
        ES_INDEX_PREFIX: props.indexPrefix,
        DATA_TABLE: props.sourceTable.tableName,
      },
    });
    props.sourceTable.grantReadData(dynamoToEsFn);
    domain.grantWrite(dynamoToEsFn);
    const dynamoSource = new DynamoEventSource(props.sourceTable, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 100,
      retryAttempts: 3,
    });
    dynamoToEsFn.addEventSource(dynamoSource);

    const dynamoToEsErrors = dynamoToEsFn.metricErrors({
      period: cdk.Duration.minutes(1),
    });

    const alarmTopic = sns.Topic.fromTopicArn(this, 'alarmTopic', props.alarmTopicArn);

    const searchAlarm = new cloudwatch.Alarm(this, 'dynamoToEsErrorsAlarm', {
      metric: dynamoToEsErrors,
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
      alarmDescription: 'An error occurred during the DynamoDbToEs function execution',
    });

    searchAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    // create the Lambda Function to search on ES
    const searchFn = new lambda.Function(this, 'SearchFn', {
      code: new lambda.AssetCode('../api/search', {
        bundling: {
          image: cdk.DockerImage.fromRegistry('node:14-alpine'),
          command: ['sh', 'cdk-build.sh'],
          user: '1000',
        },
      }),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      description: 'Function to perform searches on elasticsearch',
      environment: {
        ES_HOST: domain.domainEndpoint,
        ES_INDEX_PREFIX: props.indexPrefix,
      },
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });
    domain.grantRead(searchFn);

    this.searchFn = searchFn;

    const getPlaceFn = new lambda.Function(this, 'getPlaceFn', {
      code: new lambda.AssetCode('../api/get_place'),
      handler: 'main.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_8,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      description: 'Function to perform get of a place',
      environment: {
        DATA_TABLE: props.sourceTable.tableName,
      },
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });
    props.sourceTable.grantReadData(getPlaceFn);

    this.getPlaceFn = getPlaceFn;

    // print the domain endpoint
    new cdk.CfnOutput(this, 'Endpoint', {
      value: domain.domainEndpoint,
    });
  }

  /**
   * The lambda function to search
   */
  searchFn: lambda.Function;
  /**
   * Function per il get di un place
   */
  getPlaceFn: lambda.Function;
}
