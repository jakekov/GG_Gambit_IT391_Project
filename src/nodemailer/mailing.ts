import nodemailer from "nodemailer";
import {google} from "googleapis";
import {email} from "../config/config"
// const REDIRECT_URI = 'http://localhost';
// const oAuth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   REDIRECT_URI
// );

// console.log(process.env.GOOGLE_REFRESH_TOKEN);
//  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
//function to send email to the user
// import path from 'node:path';
// import process from 'node:process';
// import {authenticate} from '@google-cloud/local-auth';
// //import {google} from 'googleapis';



// // The scope for reading Gmail labels.
// const SCOPES = ['https://mail.google.com/',
//       'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
//       'https://www.googleapis.com/auth/gmail.compose',
//       'https://www.googleapis.com/auth/gmail.modify',
//       'https://www.googleapis.com/auth/gmail.send',];
// // The path to the credentials file.
// const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// /**
//  * Lists the labels in the user's account.
//  */
// async function listLabels() {
//   // Authenticate with Google and get an authorized client.
//   const auth = await authenticate({
//     scopes: SCOPES,
//     keyfilePath: CREDENTIALS_PATH,
    
//   });
//   if (!auth) {
//     console.log("auth null");
//     return;
//   }
//   // Create a new Gmail API client.
//   const gmail = google.gmail({ version: 'v1', auth});
//   let res = await gmail.users.messages.send({
//     userId: "me",
//     requestBody: {
//       // request body parameters
//       // {
//       //   "historyId": "my_historyId",
//       //   "id": "my_id",
//       //   "internalDate": "my_internalDate",
//       //   "labelIds": [],
//       //   "payload": {},
//       //   "raw": "my_raw",
//       //   "sizeEstimate": 0,
//       //   "snippet": "my_snippet",
//       //   "threadId": "my_threadId"
//       // }
//       },
//     media: {
//       mimeType: 'placeholder-value',
//       body: 'placeholder-value',
//     },
//   })
//   console.log(res.data);
//   return;
//   // Get the list of labels.
//   const result = await gmail.users.labels.list({
//     userId: 'me',
//   });
//   const labels = result.data.labels;
//   if (!labels || labels.length === 0) {
//     console.log('No labels found.');
//     return;
//   }
//   console.log('Labels:');
//   // Print the name of each label.
//   labels.forEach((label) => {
//     console.log(`- ${label.name}`);
//   });
// }

export const sendMail = async (
  from: string,
  to: string,
  subject: string,
  text: string,
) => {
   //const access_token = await oAuth2Client.getAccessToken();
//    let token = access_token.token;
//    if (!token) {
//     console.log("Token is null or undefined")
//     return;
//    }
    //await listLabels();
    //return;
  try {
    let mailOptions = {
      from,
      to,
      subject,
      text,
    };
    //asign createTransport method in nodemailer to a variable
    //service: to determine which email platform to use
    //auth contains the senders email and password which are all saved in the .env
    //it says this will get a access token by itself
      
    const Transporter = nodemailer.createTransport({
        service: "gmail",
  auth: {
    user: email.email_user,
    pass: email.app_password
   
  },
    });

    //return the Transporter variable which has the sendMail method to send the mail
    //which is within the mailOptions
    return await Transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};
