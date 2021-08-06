import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as es from '@aws-cdk/aws-elasticsearch';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import { DynamoEventSource } from '@aws-cdk/aws-lambda-event-sources';
import * as logs from '@aws-cdk/aws-logs';

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
}

export class SearchConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: SearchConstructProps) {
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

    new cloudwatch.Alarm(this, 'dynamoToEsErrorsAlarm', {
      metric: dynamoToEsErrors,
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
      alarmDescription: 'An error occurred during the DynamoDbToEs function execution',
    });

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

    // print the domain endpoint
    new cdk.CfnOutput(this, 'Endpoint', {
      value: domain.domainEndpoint,
    });
  }

  /**
   * The lambda function to search
   */
  searchFn: lambda.Function;
}
