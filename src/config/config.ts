import dotenv from 'dotenv';
dotenv.config();
interface Config {
  server_addr: string;
  server_port: number;
  verification_timeout: number;
  email_verification: boolean;
  jwt_secret: string;
  http: string;
}
interface DB {
  DB_HOST: string;
  DB_USER: string;
  DB_PASS: string;
  DB_NAME: string;
}
interface Email {
  email_user: string;
  app_password: string;
}
interface GoogleSignIn {
  ENABLED: boolean;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}
const config: Config = {
  server_addr: getEnvVar('SERVER_ADDR'),
  server_port: parseInt(getEnvVar('SERVER_PORT')) || 3000,
  verification_timeout: 900_000, //15 minutes
  email_verification: getEnvVar('REQUIRE_EMAIL_VERIFICATION') === 'true',
  jwt_secret: getEnvVar('JWT_SECRET'),
  http: getEnvVarOr('HTTP_TYPE', 'http'), //until or if we use a certificate
};
export const email: Email = {
  email_user: getEnvVar('EMAIL_USER'),
  app_password: getEnvVar('APP_PASSWORD'),
};
export const db: DB = {
  DB_HOST: getEnvVar('DB_HOST'),
  DB_USER: getEnvVar('DB_USER'),
  DB_NAME: getEnvVar('DB_NAME'),
  DB_PASS: getEnvVar('DB_PASS'),
};
export const google_sign_in = load_google_sign_in();
function load_google_sign_in(): GoogleSignIn {
  var output: GoogleSignIn | undefined;

  try {
    output = {
      ENABLED: true,
      GOOGLE_CLIENT_ID: getEnvVar('GOOGLE_CLIENT_ID'),
      GOOGLE_CLIENT_SECRET: getEnvVar('GOOGLE_CLIENT_SECRET'),
    };
  } catch (err) {
    console.log('Google Sign In config could not be created');
    return {
      ENABLED: false,
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
    };
  }
  return output;
}
function getEnvVarOr(key: string, or: string): string {
  const value = process.env[key];
  if (!value) {
    return or;
  }
  return value;
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is missing`);
  }
  return value;
}
export default config;

/* eslint no-process-env:0 */
