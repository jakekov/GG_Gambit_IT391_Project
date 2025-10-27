import app from './app.js';
import config from './config/config.js';

app.listen(config.server_port, () => {
  console.log(`Server running on port ${config.server_port}`);
});
