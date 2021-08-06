import * as cdk from '@aws-cdk/core';
import * as cf from '@aws-cdk/aws-cloudfront';
import * as s3 from '@aws-cdk/aws-s3';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as route53 from '@aws-cdk/aws-route53';
import * as route53tg from '@aws-cdk/aws-route53-targets';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';

export interface BaseWebAppConstructProps {
  /**
   * The domain of the website
   *
   * @example test.quipass.shop
   */
  domain: string;
  /**
   * The ARN of a certificate in ACM Viriginia (us-east-1) to be used
   * by Cloudfront
   */
  certificateArn: string;
  /**
   * The Route53 zone name where the ARecord should be written.
   *
   * @example quipass.shop
   */
  zoneName?: string;
  /**
   * Whether caching should be enabled for S3 origin
   */
  shouldCacheS3: boolean;
  /**
   * Which command to use to build the frontend
   */
  buildCommand: string;
  /**
   * The base url for api: `/api` if the api is in the same domain as the f/e
   */
  apiBaseUrl: string;
}

export interface WebAppConstructProps extends BaseWebAppConstructProps {
  /**
   * The api stage to be used for the API.
   * The stage name will be used as origin path for CDN Distribution.
   * (i.e. if stageName = api => all traffic to api/* will be directed to the api)
   */
  apiStage: apigateway.Stage;
  /**
   * Identity Pool ID to access the map
   */
  mapIdentityPoolId: string;
  /**
   * AWS region
   */
  region: string;
}

export class WebAppConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: WebAppConstructProps) {
    super(scope, id);

    // create the bucket
    const bucket = new s3.Bucket(this, 'WebApp', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.frontendBucket = bucket;

    new BucketDeployment(this, 'WebAppDeployment', {
      destinationBucket: bucket,
      sources: [
        Source.asset('../website', {
          bundling: {
            image: cdk.DockerImage.fromRegistry('node:14-alpine'),
            command: ['sh', 'cdk-build.sh', props.buildCommand],
            user: '1000',
          },
        }),
      ],
      destinationKeyPrefix: 'v1',
    });

    // create the Origin Access Identity
    const oai = new cf.OriginAccessIdentity(this, 'OAI', {
      comment: 'Origin Access Identity for CloudFront to access the webapp bucket',
    });

    bucket.grantRead(oai);

    // cache values
    const maxTtl = cdk.Duration.days(props.shouldCacheS3 ? 1 : 0);
    const minTtl = cdk.Duration.hours(props.shouldCacheS3 ? 3 : 0);
    const defaultTtl = cdk.Duration.hours(props.shouldCacheS3 ? 12 : 0);

    // create the distribution
    const distr = new cf.CloudFrontWebDistribution(this, 'CDN', {
      viewerCertificate: {
        aliases: [props.domain],
        props: {
          acmCertificateArn: props.certificateArn,
          minimumProtocolVersion: 'TLSv1.2_2018',
          sslSupportMethod: 'sni-only',
        },
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: oai,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              defaultTtl: defaultTtl,
              maxTtl: maxTtl,
              minTtl: minTtl,
            },
          ],
          originPath: '/v1',
        },
        {
          customOriginSource: {
            domainName: `${props.apiStage.restApi.restApiId}.execute-api.${props.apiStage.stack.region}.amazonaws.com`,
          },
          behaviors: [
            {
              allowedMethods: cf.CloudFrontAllowedMethods.ALL,
              compress: true,
              defaultTtl: cdk.Duration.seconds(0),
              maxTtl: cdk.Duration.seconds(0),
              minTtl: cdk.Duration.seconds(0),
              forwardedValues: {
                queryString: true,
                headers: ['Authorization'],
              },
              pathPattern: `/${props.apiStage.stageName}/*`,
            },
          ],
        },
      ],
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // create the A Record in Route53
    if (props.zoneName) {
      const zone = route53.HostedZone.fromLookup(this, 'R53Zone', {
        domainName: props.zoneName,
      });
      new route53.ARecord(this, 'ARecord', {
        recordName: props.domain,
        zone: zone,
        target: route53.RecordTarget.fromAlias(new route53tg.CloudFrontTarget(distr)),
      });
    }

    new cdk.CfnOutput(bucket, 'BucketName', {
      value: bucket.bucketName,
      description: 'WebApp EndUser Bucket Name',
    });

    new cdk.CfnOutput(distr, 'CFDomainURL', {
      value: `https://${distr.distributionDomainName}/`,
      description: 'WebApp CloudFront URL',
    });
  }
  frontendBucket: s3.IBucket;
}
