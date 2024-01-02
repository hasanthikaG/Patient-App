import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { appClientConfig, cognitoConfigs } from "./aws-configs/cognito";
import { UserPoolOperation } from "aws-cdk-lib/aws-cognito";
import { Duration } from "aws-cdk-lib";

export class Authenticator extends Construct {
  private cognitoClientId: string;
  public userPoolId: string;
  public userPoolInstance;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);
    this.userPoolInstance = this.cognitoInit();
  }

  private cognitoInit() {
    const pool = new cognito.UserPool(this, "patientUserPool", cognitoConfigs);
    pool.addTrigger(
      UserPoolOperation.PRE_SIGN_UP,
      new lambdaNodejs.NodejsFunction(this, "[Auth]PreSignUp", {
        functionName: "PreSignUp",
        entry: path.join(__dirname, "..", "lambda/authenticate/preSignUp.ts"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        bundling: {
          target: "es2020",
        },
        timeout: Duration.seconds(30),
      }),
    );

    const client = pool.addClient("appClient", appClientConfig);
    this.cognitoClientId = client.userPoolClientId;
    this.userPoolId = pool.userPoolId;

    new cdk.CfnOutput(this, "UserPoolIdOutput", {
      value: pool.userPoolId,
    });
    new cdk.CfnOutput(this, "AppClientIdOutput", {
      value: client.userPoolClientId,
    });
    return pool;
  }

  signUp() {
    return new lambdaNodejs.NodejsFunction(this, "[Auth]SignUpHandler", {
      functionName: "SignUp",
      entry: path.join(__dirname, "..", "lambda/authenticate/signUp.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        target: "es2020",
      },
      environment: {
        COGNITO_CLIENT_ID: this.cognitoClientId,
      },
      timeout: Duration.seconds(30),
    });
  }

  signIn() {
    return new lambdaNodejs.NodejsFunction(this, "[Auth]SignInHandler", {
      functionName: "SignIn",
      entry: path.join(__dirname, "..", "lambda/authenticate/signIn.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        target: "es2020",
      },
      environment: {
        USER_POOL_ID: this.userPoolId,
        APP_CLIENT_ID: this.cognitoClientId,
      },
      timeout: Duration.seconds(30),
    });
  }
}
