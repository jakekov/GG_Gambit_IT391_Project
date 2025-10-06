import app from "./app";
import config from "./config/config";

app.listen(config.server_port, () => {
  console.log(`Server running on port ${config.server_port}`);
});
