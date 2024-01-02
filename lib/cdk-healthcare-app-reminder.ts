import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Duration } from "aws-cdk-lib";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import * as events from "aws-cdk-lib/aws-events";

export interface ReminderProps {
  appointmentHourlyReminderTable: dynamodb.Table;
  userPoolId: string;
  reminderTable: string;
}

export class Reminder extends Construct {
  public hourlyReminder: lambda.Function;
  constructor(scope: Construct, id: string, props: ReminderProps) {
    super(scope, id);
    this.hourlyReminder = new lambdaNodejs.NodejsFunction(
      this,
      "[Auth]HourlyReminder",
      {
        functionName: "Reminder",
        entry: path.join(__dirname, "..", "lambda/reminder/reminder.ts"),
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        bundling: {
          target: "es2020",
        },
        environment: {
          USER_POOL_ID: props.userPoolId,
          REMINDER_TABLE_NAME: props.reminderTable,
        },
      },
    );

    this.hourlyReminder.role?.addManagedPolicy({
      managedPolicyArn: "arn:aws:iam::aws:policy/AmazonSESFullAccess",
    });

    this.hourlyReminder.role?.addManagedPolicy({
      managedPolicyArn: "arn:aws:iam::aws:policy/AmazonCognitoReadOnly",
    });

    this.hourlyReminder.role?.addManagedPolicy({
      managedPolicyArn: "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
    });

    new events.Rule(this, "hourly-reminder", {
      schedule: events.Schedule.rate(Duration.minutes(1)),
      targets: [new LambdaFunction(this.hourlyReminder)],
    });
  }
}
