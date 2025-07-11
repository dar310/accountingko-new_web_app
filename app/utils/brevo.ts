import * as SibApiV3Sdk from '@sendinblue/client';

const emailClient = new SibApiV3Sdk.TransactionalEmailsApi();

brevoClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

export { emailClient };
