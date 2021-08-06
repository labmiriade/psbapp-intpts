import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';

/*
 * This Props is currently not used but kept because could result handy in next steps
 */

export interface UserManagementConstructProps {
  /**
   * The email address from which to send the email
   */
  emailFrom?: string;
  /**
   * Domain Certificate
   */
  certificate: string;
  /**
   * Login domain name
   */
  domainName: string;
  /**
   * Callback urls
   */
  callbackUrls: string[];
}

/**
 * Construct che si occupa di creare tutte le risorse necessarie all'user management
 * (Cognito User Pool, client, eventuali lambda, …)
 */
export class UserManagementConstruct extends cdk.Construct {
  userPool: cognito.UserPool;
  constructor(scope: cdk.Construct, id: string, props: UserManagementConstructProps) {
    super(scope, id);

    // Setup Email
    const emailSettings: cognito.EmailSettings = {
      from: props.emailFrom,
    };

    // Setup User Verification Texts
    const userVerification: cognito.UserVerificationConfig = {
      emailBody: 'Ciao, benvenuto in QuiPass.\nPer verificare la tua mail clicca sul seguente link: {##Verify Email##}',
      emailStyle: cognito.VerificationEmailStyle.LINK,
      emailSubject: 'Verifica il tuo indirizzo email',
    };

    // Setup User Invitation Texts
    const userInvitation: cognito.UserInvitationConfig = {
      emailBody: `Ciao, benvenuto in QuiPass.\nEcco il tuo username: "{username}" e la password provvisoria <pre>{####}</pre>\nPuoi accedere qui: <a href="https://${props.domainName}">${props.domainName}</a>`,
      emailSubject: 'Benvenuto in QuiPass',
    };

    // The user pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      // Create the `custom:adminPlaces` attribute
      customAttributes: {
        adminPlaces: new cognito.StringAttribute({
          mutable: true,
        }),
        company: new cognito.StringAttribute({
          mutable: true,
        }),
      },
      // autoverify every mail
      autoVerify: {
        email: true,
        phone: false,
      },
      emailSettings,
      // disable self signup
      selfSignUpEnabled: false,
      // user can login with email, username or preferred_username
      signInAliases: {
        email: true,
        phone: false,
        username: true,
        preferredUsername: true,
      },
      userInvitation,
      userVerification,
    });

    // Disable the custom domain to log in
    // const domainCert = acm.Certificate.fromCertificateArn(this, 'DomainCert', props.certificate);
    // userPool.addDomain('UserPoolDomain', {
    //   customDomain: {
    //     certificate: domainCert,
    //     domainName: props.domainName,
    //   },
    // });

    // the app client to be used by the admin webapp
    const adminWebAppClient = this.userPool.addClient('AdminWebAppClient', {
      generateSecret: false,
      authFlows: {
        userSrp: true,
      },
    });

    //TODO: add read/write attributes as soon as issue #7407 closes https://github.com/aws/aws-cdk/issues/7407

    new cdk.CfnOutput(this.userPool, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'The UserPool ID for User Management',
    });

    new cdk.CfnOutput(this.userPool, 'ClientId', {
      value: adminWebAppClient.userPoolClientId,
      description: 'The UserPoolClient ID for the Admin WebApp Client',
    });
  }
}
