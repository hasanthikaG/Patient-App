import * as AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IReminder } from "../appointment/appointment";

interface LambdaResponse {
  statusCode: number;
  body: string;
}

export const handler = async (): Promise<LambdaResponse | undefined> => {
  try {
    const reminderData = await scanReminderTable();
    console.log("reminderData", reminderData);
    if (!reminderData) {
      return;
    }

    for (const item of reminderData) {
      if (hasExpired(item.remind_at)) {
        console.log("Expired!");
        const user = await getCognitoUser(item.patient_id);
        console.log("user", user);

        const message =
          item.reminderType === "60_Minutes_Before"
            ? "You have one hour for your appointment!"
            : "You have only 15 minutes for your appointment!";

        const emailObj = user.UserAttributes?.filter(
          (e) => e.Name === "email",
        ) as { Value: string }[];

        await sendEmail(emailObj[0].Value as string, message);
        await deleteReminder(item.appointment_id, item.reminder_id);
      }
    }

    return;
  } catch (error) {
    console.log("Error:", error);
    throw error;
  }
};

const scanReminderTable = async (): Promise<IReminder[] | undefined> => {
  try {
    const docClient = new AWS.DynamoDB.DocumentClient({
      region: process.env.REGION,
    });

    const params: DocumentClient.ScanInput = {
      TableName: process.env.REMINDER_TABLE_NAME as string,
    };

    const data = await docClient.scan(params).promise();
    console.log("scanReminderTable", { data });
    if (data.Items && data.Items.length > 0) {
      return <IReminder[]>data.Items;
    }
    return;
  } catch (error) {
    console.log("scanReminderTable-ERROR:", error);
    throw error;
  }
};

const getCognitoUser = async (username: string) => {
  console.log("getCognitoUser", { username });
  try {
    const cognitoIdentityServiceProvider =
      new AWS.CognitoIdentityServiceProvider({ region: process.env.REGION });

    const params = {
      Username: username,
      UserPoolId: process.env.USER_POOL_ID as string,
    };
    const result = await cognitoIdentityServiceProvider
      .adminGetUser(params)
      .promise();
    console.log("result", result);
    return result;
  } catch (error) {
    console.log("getCognitoUser-Error:", error);
    throw error;
  }
};

const sendEmail = async (userEmail: string, message: string) => {
  console.log("sendEmail", { userEmail, message });
  try {
    const ses = new AWS.SES({ region: process.env.REGION });

    const params = {
      Source: "thisera.sajith@gmail.com",
      Destination: { ToAddresses: [userEmail] },
      Message: {
        Subject: { Data: "Reminder!" },
        Body: { Text: { Data: message } },
      },
    };

    await ses.sendEmail(params).promise();
    return;
  } catch (error) {
    console.log("getCognitoUser-Error:", error);
    throw error;
  }
};

const hasExpired = (isoTimestamp: string) => {
  const expirationDate = new Date(isoTimestamp);
  const currentTime = new Date();
  return currentTime > expirationDate;
};

const deleteReminder = async (
  appointment_id: string,
  reminder_id: string,
): Promise<void> => {
  try {
    const docClient = new AWS.DynamoDB.DocumentClient({
      region: process.env.REGION,
    });

    const params: DocumentClient.DeleteItemInput = {
      TableName: process.env.REMINDER_TABLE_NAME as string,
      Key: {
        appointment_id: appointment_id,
        reminder_id: reminder_id,
      },
    };

    await docClient.delete(params).promise();
    return;
  } catch (error) {
    console.log("scanReminderTable-ERROR:", error);
    throw error;
  }
};
