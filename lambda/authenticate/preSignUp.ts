import { Callback, Context } from "aws-lambda";
export interface IPreSignupInput {
  triggerSource: string;
  userName: string;
  response: {
    autoConfirmUser: boolean;
    autoVerifyEmail: boolean;
  };
}
export const handler = async (
  event: IPreSignupInput,
  context: Context,
  callback: Callback,
): Promise<void> => {
  console.log("Pre SignUp Handler", event, context);

  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
  callback(null, event);
};
