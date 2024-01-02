#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkHealthcareAppStack } from "../lib/cdk-healthcare-app-stack";

const app = new cdk.App();
new CdkHealthcareAppStack(app, "CdkHealthcareAppStack", {
  env: { account: process.env.AWS_ACCOUNT, region: process.env.REGION },
});
