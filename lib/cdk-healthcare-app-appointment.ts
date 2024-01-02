import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { StreamViewType } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path";
import * as cdk from "aws-cdk-lib";

export class Appointment extends Construct {
  public appointmentTable: dynamodb.Table;
  public reminderTable: dynamodb.Table;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);
    this.setupAppointmentTable();
    this.setupReminderTable();
  }

  private setupAppointmentTable() {
    this.appointmentTable = new dynamodb.Table(this, "Appointments", {
      tableName: "Appointments",
      partitionKey: { name: "patient_id", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "appointment_id", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }

  private setupReminderTable() {
    this.reminderTable = new dynamodb.Table(this, "ReminderTable", {
      tableName: "Reminder",
      partitionKey: {
        name: "appointment_id",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "reminder_id", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }

  //make the appointment
  createAppointment() {
    const fn = new lambdaNodejs.NodejsFunction(this, "AppointmentHandler", {
      functionName: "BookAppointment",
      entry: path.join(__dirname, "..", "lambda/appointment/appointment.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        APPOINTMENTS_TABLE_NAME: this.appointmentTable.tableName,
        REMINDER_TABLE_NAME: this.reminderTable.tableName,
      },
      bundling: {
        target: "es2020",
      },
    });
    // grant the lambda role read/write permissions to appointmentTable and notificationTable
    this.appointmentTable.grantReadWriteData(fn);
    this.reminderTable.grantReadWriteData(fn);
    return fn;
  }

  //Get appointments
  getAppointments() {
    const fn = new lambdaNodejs.NodejsFunction(this, "GetAppointmentHandler", {
      functionName: "GetAppointments",
      entry: path.join(__dirname, "..", "lambda/appointment/getAppointment.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        APPOINTMENTS_TABLE_NAME: this.appointmentTable.tableName,
      },
      bundling: {
        target: "es2020",
      },
    });
    // grant the lambda role read/write permissions to appointmentTable table
    this.appointmentTable.grantReadWriteData(fn);
    return fn;
  }
}
