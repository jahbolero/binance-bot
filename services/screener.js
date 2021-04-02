const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const { resolve } = require('path');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize() {
  
  return new Promise(async (resolve, reject) =>{
    let credentials = JSON.parse(process.env.credentials);
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  
    let token = JSON.parse(process.env.token);
    if(token){
      try{
        oAuth2Client.setCredentials(token);
        let data = await findMessages(oAuth2Client);
        data = await removeNoise(data);
        resolve(data);
      } catch(err) {
        reject(err);
      }
    } else {
      getNewToken(oAuth2Client, findMessages);
    } 
  });
  // fs.readFile(TOKEN_PATH, (err, token) => {
  //   if (err) return getNewToken(oAuth2Client, findMessages);
  //   console.log(JSON.parse(token));
  //   oAuth2Client.setCredentials(JSON.parse(token));
  //   findMessages(oAuth2Client);
  // });
}

function removeNoise(data){
  let ret = [];
  console.log(data, 'leng');
  data.forEach(coin => {
    let temp = coin.replace(',', '');
    if(temp.slice(temp.length - 4) === 'USDT'){
      ret.push(temp);
    }
  });

  return ret;
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function findMessages(auth) {

  return new Promise((resolve, reject) => {
    const gmail = google.gmail({version: 'v1', auth});
    gmail.users.messages.list({
      userId: 'me',
      labelIds: 'INBOX'
    }, async (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const messages = res.data.messages;
      if (messages) {
        try{
          let data = await printMessage(messages, auth);
          resolve(data);
        } catch(err){
          reject(err);
        }
      } else {
        reject(console.log('No messages found.'));
      }
    });
  });
}

async function printMessage(messageID,auth) {
  return new Promise((resolve, reject) => {
    let promises = [];
    let ret = [];
    var gmail = google.gmail('v1');
  
    
    gmail.users.messages.get({ auth: auth, userId: 'me', id:messageID[0].id }, function(err, response) {
      messageID.splice(0,1);
      if(messageID.length > 0)
        printMessage(messageID,auth);
      else {
        console.log("All Done");
      }
    });
  
    messageID.forEach(async id => {
      promises.push((filterMessages(id.id, gmail,messageID, auth)));
    });
  
    
    try {
      Promise.all(promises).then(x => {
        x.forEach(data => {
          let temp = data.data.snippet.split(" ");
          temp = temp.filter(x => x.includes('BINANCE') && x.length > 8);
          ret = [...ret, ...temp];
        });
        let unique = new Set(ret);
        resolve(unique);
      });
    } catch(err){
      reject('failed to get data')
    }
  });
}


async function filterMessages(id, gmail,messageID, auth){
  return gmail.users.messages.get({ auth: auth, userId: 'me', id: id });
}




function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.labels.list({userId: 'me', }, (err, res) => 
  { if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`- ${label.name} ${label.id}`);
      });
    } else {
      console.log('No labels found.');
    }
  });
}

module.exports = {
  authorize: authorize
};