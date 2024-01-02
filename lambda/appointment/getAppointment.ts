import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { extractTokenData } from "../helper";

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const dynamoDB = new AWS.DynamoDB.DocumentClient({
      region: process.env.REGION,
    });
    const tokenDecode = extractTokenData(
      event?.headers?.Authorization as string,
    );
    const patientId = tokenDecode.sub;

    const tableName = process.env.APPOINTMENTS_TABLE_NAME as string;

    const scanResult = await dynamoDB
      .query({
        TableName: tableName,
        KeyConditionExpression: "patient_id= :patientId",
        ExpressionAttributeValues: {
          ":patientId": patientId,
        },
      })
      .promise();
    const appointments = scanResult.Items;
    console.log("Retrieved Appointments:", JSON.stringify(appointments));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appointments),
    };
  } catch (error) {
    console.error("Error retrieving appointments:", error);
    throw error;
  }
};
