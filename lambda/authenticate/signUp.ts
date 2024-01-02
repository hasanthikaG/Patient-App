import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";

export interface ISignUp {
  familyName: string;
  givenName: string;
  password: string;
  email: string;
}

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("SignUp Handler", event);

  try {
    const body = JSON.parse(event.body as string);
    await cognitoSignup(body);

    return {
      body: JSON.stringify({
        message: "Patient Registered Successfully",
      }),
      statusCode: 200,
    };
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};

const cognitoSignup = async (body: ISignUp): Promise<void> => {
  try {
    const { email, password, familyName, givenName } = body;

    const cognitoIdentityServiceProvider =
      new AWS.CognitoIdentityServiceProvider({ region: process.env.REGION });

    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID as string,
      Password: password,
      Username: email,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "family_name",
          Value: familyName,
        },
        {
          Name: "given_name",
          Value: givenName,
        },
      ],
    };
    console.log("params", params);
    await cognitoIdentityServiceProvider.signUp(params).promise();
  } catch (error) {
    console.log("cognitoSignup-ERROR", error);
    throw error;
  }
};
