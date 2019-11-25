# GDriveToCSVDump
A simple server written in node.js to dump sensor values into a CSV on GDrive. A new subfolder is generated for every sensor identifier  as well as a new csv file in this subfolder for every day.

*Timestamp integrity is not secured and lines are just appended to the CSV file for every event*. 

## Installation
Clone this repository. Make sure you have node.js and npm installed. Navigate to the root of the project from your command line. Run the following command.

```
npm install
```

Before you can run the application you will have to obtain a token from google drive by following the steps behind [this link](https://developers.google.com/drive/api/v3/enable-drive-api). After creating an app, genereate OAuth Client ID credentials and download the credentials file. Rename the file to credentials.json.


## Running 
Start the server with the following command. 
```
npm start
```

When running the application for the first time you will have to follow the instructions shown in the command line. Follow the link and enter the access key. This will generate an access token file automatically for the defined scope of this application.

## Usage
The server exposes an http post backend API and accepts form url encoded content.

```
curl -d "sensor=temperature1&timestamp=1574517436139&value=23.4&unit=Celsius" -X POST http://localhost:3000/event/
```
**Important: Google's courtesy limit of the drive API is 1'000'000 calls per day and 1'000 requests per 100 seconds. Keep this in mind when pushing data to the server.**

## Arduino Usage Example

## Feature List
- Generate Dynamic Pages from Sensors (e.g. overview of all sensors and also data visualization)

## Error Handling
**Error loading client secret file: [Error: ENOENT: no such file or directory, open '...\credentials.json']**
Please make sure to follow the steps under "Installation" to add a credentials.json to the projects root.
