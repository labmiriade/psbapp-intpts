import * as cdk from 'aws-cdk-lib';
import { ApiGatewayConstruct } from './apigateway-construct';
import { WebAppConstruct, BaseWebAppConstructProps } from './webapp-stack';
import { CoreConstruct } from './core-construct';
import { SearchConstruct, BaseSearchConstructProps } from './search-construct';
import { AuthConstruct } from './auth-construct';
import { ConfigWriterConstruct } from './config-env-writer';
import { Construct } from 'constructs';

export interface InfrastructureStackProps extends cdk.StackProps {
  // userManagement: DarvadUserManagementConstructProps;
  endUserWebApp: BaseWebAppConstructProps;
  // adminWebApp: BaseDarvadWebAppConstructProps;
  /**
   * Whether to delete everything on removal of the stack,
   * should be false ONLY for production or other sensitive environments
   */
  destroyOnRemoval: boolean;
  /**
   * CSV data urls
   */
  csvDataUrls: string;
  /**
   * Arn of the map to use in the frontend.
   */
  locationMapArn: string;
  /**
   * Props for the search construct
   */
  searchProps: BaseSearchConstructProps;
  /**
   * The email to send notification alarms to
   */
  alarmEmail: string;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const core = new CoreConstruct(this, 'Core', {
      destroyOnRemoval: props.destroyOnRemoval,
      csvDataUrls: props.csvDataUrls,
      alarmEmail: props.alarmEmail,
    });

    // const userManagement = new DarvadUserManagementConstruct(this, 'Users', props.userManagement);

    const search = new SearchConstruct(this, 'Search', {
      ...props.searchProps,
      alarmTopicArn: core.alarmTopicArn,
      sourceTable: core.dataTable,
    });

    const mainGW = new ApiGatewayConstruct(this, 'MainApi', {
      dataTable: core.dataTable,
      // userPool: userManagement.userPool,
      searchLambda: search.searchFn,
      getPlaceLambda: search.getPlaceFn,
    });

    let regexLocationName = props.locationMapArn.match(/.*:map\/(.*)/);
    if (!regexLocationName) {
      regexLocationName = ['', 'explore.map'];
    }

    const auth = new AuthConstruct(this, 'Auth', {
      locationMapArn: props.locationMapArn,
      pinpointArn: core.pinpointArn,
    });

    const endUserCDN = new WebAppConstruct(this, 'EndUser', {
      apiStage: mainGW.stage,
      mapIdentityPoolId: auth.identityPool.ref,
      region: props.env?.region ?? 'eu-west-1',
      ...props.endUserWebApp,
    });

    const configWriter = new ConfigWriterConstruct(this, 'ConfigWriter', {
      bucket: endUserCDN.frontendBucket,
      objectKey: 'v1/assets/config-env.json',
      baseUrl: props.endUserWebApp.apiBaseUrl,
      awsRegion: props.env?.region ?? 'eu-west-1',
      awsMapName: regexLocationName[1],
      awsIdentityPoolId: auth.identityPool.ref,
      pinpointArn: core.pinpointArn,
    });

    configWriter.node.addDependency(auth.identityPool);
    configWriter.node.addDependency(endUserCDN.frontendBucket);

    /*
    // const adminCDN = new WebAppConstruct(this, 'Admin', {
    //   apiStage: mainGW.stage,
    //   ...props.adminWebApp,
    // });
    */
  }
}
