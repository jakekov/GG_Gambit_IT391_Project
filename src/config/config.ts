
require('dotenv').config();
interface Config {
  server_addr: string,
  server_port: string,
  verification_timeout: number,
  email_verification: boolean,
}
interface DB {
  DB_HOST: string,
  DB_USER: string,
  DB_PASS: string,
  DB_NAME: string,
}
interface Email {
  email_user: string,
  app_password: string,
}
const config: Config = {
  server_addr: getEnvVar('SERVER_ADDR'),
  server_port: getEnvVar('SERVER_PORT'),
  verification_timeout: 900_000, //15 minutes
  email_verification: false
};
export const email: Email = {
  email_user: getEnvVar('EMAIL_USER'),
  app_password: getEnvVar('APP_PASSWORD'),
}
export const db: DB = {
  DB_HOST: getEnvVar('DB_HOST'),
  DB_USER:getEnvVar('DB_USER'),
  DB_NAME: getEnvVar('DB_NAME'),
  DB_PASS: getEnvVar('DB_PASS'),
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
