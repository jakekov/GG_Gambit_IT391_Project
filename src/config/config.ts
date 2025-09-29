interface Config {
  port: number;
  verification_timeout: number;
}
const config: Config = {
  port: 3000,
  verification_timeout: 900_000, //15 minutes
};
export default config;
