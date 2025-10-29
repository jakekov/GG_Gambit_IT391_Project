import app from './app.js';
import config from './config/config.js';

const HOST: string = '0.0.0.0';
app.listen(config.server_port, HOST, () => {
  console.log(`Server running on port ${config.server_port}`);
});
