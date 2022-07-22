import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface AuthConstructProps {
  locationMapArn: string;
  pinpointArn: string;
}

export class AuthConstruct extends Construct {
  constructor(scope: Construct, id: string, props: AuthConstructProps) {
    super(scope, id);

    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: true,
    });

    const mapAccessPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: [props.locationMapArn],
          actions: ['geo:GetMapGlyphs', 'geo:GetMapSprites', 'geo:GetMapStyleDescriptor', 'geo:GetMapTile'],
        }),
      ],
    });

    const pinpointPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: [props.pinpointArn],
          actions: ['mobiletargeting:PutEvents', 'mobiletargeting:UpdateEndpoint', 'mobileanalytics:PutEvents'],
        }),
      ],
    });

    const mapAccessAnonRole = new iam.Role(this, 'IdentityPoolAnonRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      inlinePolicies: {
        allowMapAccess: mapAccessPolicy,
        allowPinPointAccess: pinpointPolicy,
      },
    });

    const mapAccessAuthRole = new iam.Role(this, 'IdentityPoolAuthRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      inlinePolicies: {
        allowMapAccess: mapAccessPolicy,
        allowPinPointAccess: pinpointPolicy,
      },
    });

    const identityPoolRoles = new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoles', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: mapAccessAuthRole.roleArn,
        unauthenticated: mapAccessAnonRole.roleArn,
      },
    });

    new cdk.CfnOutput(identityPool, 'IdentityPool', {
      value: identityPool.ref,
      description: 'Identity Pool Id',
    });

    this.identityPool = identityPool;
  }
  identityPool: cognito.CfnIdentityPool;
}
