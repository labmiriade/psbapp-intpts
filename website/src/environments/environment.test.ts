import { Environment } from 'src/app/core/interfaces/environment.interface';

export const environment: Environment = {
  production: true,
  awsRegion: '<AWS_REGION>',
  awsIdentityPoolId: '<AWS_IDENTITY_POOL_ID>',
  awsMapName: '<AWS_MAP_NAME>',
  baseUrl: 'http://localhost:8080',
};
