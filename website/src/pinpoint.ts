import { Environment } from 'src/app/core/interfaces/environment.interface';
import Analytics from '@aws-amplify/analytics';
import Auth from '@aws-amplify/auth';
export default function pinpoint(environment: Environment) {
  if (!environment.awsPinpoint) {
    return;
  }
  const amplifyConfig = {
    Auth: {
      identityPoolId: environment.awsPinpoint.identityPoolId,
      region: environment.awsPinpoint.region,
    },
  };
  Auth.configure(amplifyConfig);
  const analyticsConfig = {
    AWSPinpoint: {
      appId: environment.awsPinpoint.appId,
      region: environment.awsPinpoint.region,
      mandatorySignIn: false,
    },
  };
  Analytics.configure(analyticsConfig);
}
