import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  AuthenticationDetails,
  CognitoUserPool,
  CognitoUser,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

interface ISignIn {
  username: string;
  password: string;
}
export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("SignIn Handler", event);

    const body: ISignIn = JSON.parse(event.body as string);
    const tokens = await cognitoSignIn(body.username, body.password);
    console.log("tokens", tokens);
    return {
      body: JSON.stringify({ tokens }),
      statusCode: 200,
    };
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};

const cognitoSignIn = async (username: string, password: string) => {
  console.log("username", username, password);
  try {
    const authenticationData = {
      Username: username,
      Password: password,
    };

    const authenticationDetails = new AuthenticationDetails(authenticationData);
    const poolData = {
      UserPoolId: process.env.USER_POOL_ID as string,
      ClientId: process.env.APP_CLIENT_ID as string,
    };

    const userPool = new CognitoUserPool(poolData);
    const userData = {
      Username: username,
      Pool: userPool,
    };
    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result: CognitoUserSession) => {
          console.log("cognitoSignIn-result", result);
          const accessToken = result.getAccessToken().getJwtToken();
          const idToken = result.getIdToken().getJwtToken();
          const refreshToken = result.getRefreshToken().getToken();
          resolve({ accessToken, idToken, refreshToken });
        },

        onFailure: (err: { message: string }) => {
          console.log(err.message || JSON.stringify(err));
          reject(err.message);
        },
      });
    });
  } catch (error) {
    console.log("cognitoSignIn-ERROR", error);
    throw error;
  }
};
