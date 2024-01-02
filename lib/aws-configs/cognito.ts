import * as cognito from "aws-cdk-lib/aws-cognito";
import { Duration } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";

export const cognitoConfigs = {
  userPoolName: "PatientUserPool",
  signInCaseSensitive: false,
  selfSignUpEnabled: true,
  signInAliases: {
    email: true,
  },
  autoVerify: { email: true },
  standardAttributes: {
    familyName: {
      required: true,
      mutable: false,
    },
    givenName: {
      required: true,
      mutable: false,
    },
    email: {
      required: true,
      mutable: false,
    },
  },
  mfa: cognito.Mfa.OFF,
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: true,
    tempPasswordValidity: Duration.days(3),
  },
  accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
};

const clientWriteAttributes =
  new cognito.ClientAttributes().withStandardAttributes({
    familyName: true,
    givenName: true,
    email: true,
  });

const clientReadAttributes = clientWriteAttributes.withStandardAttributes({
  emailVerified: true,
});

export const appClientConfig = {
  authFlows: {
    userPassword: true,
    userSrp: true,
  },
  readAttributes: clientReadAttributes,
  writeAttributes: clientWriteAttributes,
  generateSecret: false,
};
