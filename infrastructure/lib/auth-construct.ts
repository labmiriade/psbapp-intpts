import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as iam from '@aws-cdk/aws-iam';

export interface AuthConstructProps {
  locationMapArn: string;
}

export class AuthConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: AuthConstructProps) {
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
