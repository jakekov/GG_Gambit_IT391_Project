Local Setup Guide
This guide explains how to run the GG Gambit web server and the associated web scraper locally for development.

---

1. Clone the Repository
   ````git clone https://github.com/jakekov/GG_Gambit_IT391_Project
   cd GG_Gambit_IT391_Project```
   ````

---

2. Review Environment Variables
   - Inside the repository, open:
   - /docs/overview.md - This file lists all environment variables used by the server.
   - Or view /config/config.ts to see the interfaces filled by env variables
   - Important Notes
     - Google Sign-In is optional — the server will run without a Google client ID or secret.
     - Email verification is also optional — if the variable REQUIRE_EMAIL_VERIFICATION=false, you do not need an email username/app password.
     - The web server will automatically update matches as long as the task runner service account environment variables are not filled.
     - All database tables are created automatically on startup if they do not exist.

---

3. Set Up MySQL
   - The server requires a MySQL instance.
   - Steps
1. Install MySQL Server (using your OS package manager or installer).
1. Create a database and user:
   ```CREATE DATABASE gg_gambit;
   CREATE USER 'gambit_user'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON gg_gambit.\* TO 'gambit_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
1. Set the corresponding environment variables (example):
   DB_HOST=localhost
   DB_USER=gambit_user
   DB_PASS=password
   DB_NAME=gg_gambit

---

4. Install Node.js Dependencies
   - Make sure Node.js is installed (preferably LTS 18.x or 20.x).
   - Then, from the project root:
     `npm install`
   - This starts the web server.

---

5. Run the Web Scraper Locally
   - Clone the scraper:

   ```git clone https://github.com/Shfloop/vlrscraper
   cd vlrscraper
   npm install
   ```

   - The scraper runs on port 5000 by default.

---

6. Configure the Web Server to Use the Local Scraper
   - Set the scraper URL environment variable to point to your local scraper instance.
   - Example:
   - SCRAPER_URL=http://localhost:5000
   - Make sure the port matches whatever the scraper uses.

---

7. Start Everything
   - Make sure MySQL is running
   - Start the web scraper
   - Start the web server
