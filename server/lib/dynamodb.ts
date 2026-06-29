import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

const region = process.env.AWS_REGION ?? "us-east-1";
const roleArn = process.env.AWS_ROLE_ARN;

const client = new DynamoDBClient({
  region,
  ...(roleArn
    ? {
        credentials: awsCredentialsProvider({
          roleArn,
          clientConfig: { region },
        }),
      }
    : {}),
});

export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ?? "meds-inn-db";
export const PARTITION_KEY = process.env.DYNAMODB_TABLE_PARTITION_KEY ?? "PK";
export const SORT_KEY = process.env.DYNAMODB_TABLE_SORT_KEY ?? "SK";

export const ENTITY_PREFIX = {
  hospital: "HOSPITAL#",
  user: "USER#",
  mother: "MOTHER#",
  appointment: "APPOINTMENT#",
  team: "TEAM#",
  medication: "MEDICATION#",
  message: "MESSAGE#",
  chat: "CHAT#",
  document: "DOCUMENT#",
  carePlan: "CAREPLAN#",
  careBrief: "CAREBRIEF#",
  analytics: "ANALYTICS#",
  waitlist: "WAITLIST#",
  userLookup: "USER_LOOKUP#",
} as const;

/** Strip DynamoDB keys before sending records to the frontend */
export function stripKeys(item: Record<string, unknown>) {
  const { [PARTITION_KEY]: _pk, [SORT_KEY]: _sk, entityType: _type, ...rest } = item;
  return rest;
}
