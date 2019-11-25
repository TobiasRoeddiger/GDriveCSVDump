const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const express = require('express');
const bodyParser = require('body-parser');
const port = 4000;
const server = express();

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';
const ROOT_FOLDER = 'SENSOR_DATA'

var drive;
var sensorFolderId;

var lastAPIRequestDictionary = {}

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), main);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
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

function retrieveFolder(name, parent, resultCallback)
{
  var fileFound = false;
  drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder'",
    fields: 'files(id, name)',
    spaces: 'drive',
    parents: [parent]
  }, function (err, res) {
    if (res.data.files !== undefined)
    {
      res.data.files.forEach(function (file) {
        if (file.name === name && !fileFound)
        {
          fileFound = true;
          resultCallback(file.id);
        }
      });
    }
    
    if (!fileFound)
    {
      resultCallback(null);
    }
  });
}

function createFolder(name, parent, resultCallback)
{
  var fileMetadata = {
    'name': name,
    'mimeType': 'application/vnd.google-apps.folder',
    parents: [parent]
  };
  drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  }, function (err, res) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      resultCallback(res.data.id);
    }
  });
}

function processSensorEvent(sensorId, timestamp, value, unit)
{
  if (!sensorFolderId) return;

  var dayFolderIdentifier = new Date(timestamp).toDateString();

  retrieveFolder(dayFolderIdentifier, sensorFolderId, function(folderId) {
    if (!folderId)
    {
      createFolder(dayFolderIdentifier, sensorFolderId, function(folderId)
      {
        storeSensorValue(folderId, sensorId, timestamp, value, unit);
      });
    }
    else
    {
      storeSensorValue(folderId, sensorId, timestamp, value, unit);
    }
  });
}

function storeSensorValue(folderId, sensorId, timestamp, value, unit)
{
  var fileId;
  drive.files.list({
    q: "mimeType='text/csv' and '" + folderId + "' in parents",
    fields: 'files(id, name)',
    parents: [folderId]
  }, function(err, res) {
    res.data.files.forEach(function (file) {

      if (file.name === (sensorId + "_" + unit + ".csv"))
      {
        // assumes that file can only be found once
        fileId = file.id;
        appendToFile(folderId, fileId, timestamp, value, sensorId);
      }
    });

    if (!fileId)
    {
      var fileMetadata = {
        'name': sensorId + "_" + unit + ".csv",
        'mimeType': 'text/csv',
        parents: [folderId]
      };
      drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      }, function (err, res) {
        if (err) {
          // Handle error
          console.error(err);
        } else {

          appendToFile(folderId, res.data.id, timestamp, value, sensorId)
        }
      });
    }
  });
}

  

function appendToFile(folderId, fileId, timestamp, value, sensorId)
{
  // check if temp path exists - create otherwise
  if (!fs.existsSync("./tmp/"))
  {
    fs.mkdirSync("./tmp/");
  }

  var randomTempFile = "./tmp/temp_" + Math.floor((Math.random() * 10000000000000)) + ".csv";

  var temporaryFile = fs.createWriteStream(randomTempFile);
  drive.files.get({
    fileId: fileId,
    parents: [folderId],
    alt: 'media'
  }, {
    responseType: 'stream'
  }, function(err, response){
    if(err)return done(err);
    
    response.data.on('error', err => {
        done(err);
    }).on('end', ()=>{
      fs.appendFile(randomTempFile, "\n" + timestamp + ", " + value, function (err) {
        if (err) {
          //console.error("failed to store sensor value: " + new Date(timestamp).toISOString() + " - " + sensorId + " - " + value)
        }
        else
        {
          var media = {
            mimeType: 'text/csv',
            body: fs.createReadStream(randomTempFile)
          };
        
          drive.files.update({
            fileId: fileId,
            media: media
          }, (err, res) => {
            fs.unlink(randomTempFile, function() {
              
            });
            if (err) {
              // Handle error
            } else {
              //console.log("stored sensor value: " + new Date(timestamp).toISOString() + " - " + sensorId + " - " + value)
            }
          });
        }
      });
    })
    .pipe(temporaryFile);
  });
}

/**
 * Intializes all server functionalities.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function main(auth) {
  drive = google.drive({version: 'v3', auth});
  retrieveFolder(ROOT_FOLDER, null, function(folderId) { 
    if (!folderId)
    {
      createFolder(ROOT_FOLDER, null, function(folderId)
      {
        sensorFolderId = folderId
        startServer();
      });
    }
    else
    {
      sensorFolderId = folderId;
      startServer();
    }
  });
}

function startServer()
{
  server.use(bodyParser.urlencoded({ extended: false }))

  server.get('/', function(req, res) {
    res.send("Server is up and running.")
  });

  server.post('/event/', function (req, res) {
    if (lastAPIRequestDictionary[req.body.sensorId] && (Date.now() - lastAPIRequestDictionary[req.body.sensorId]) / 1000 < 15) {
      res.status(409).send({ error: 'Can only call the API every 15 seconds for each sensor id (called ' + req.body.sensorId + " after " + (Date.now() - lastAPIRequestDictionary[req.body.sensorId]) / 1000 + " seconds)." });
    }
    else
    {
      lastAPIRequestDictionary[req.body.sensorId] = new Date();
      processSensorEvent(req.body.sensorId, parseInt(req.body.timestamp), req.body.value, req.body.unit);
      res.send();
    }
  });

  server.listen(port, () => {
    console.log(`server listening at ${port}`);
  });
}


module.exports = {
  SCOPES,
  main,
};
