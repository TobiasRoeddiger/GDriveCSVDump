# GDriveToCSVDump
A simple server written in node.js to dump sensor values into a CSV on GDrive. A new subfolder is generated for every sensor identifier  as well as a new csv file in this subfolder for every day.

*Timestamp integrity is not secured and lines are just appended to the CSV file for every event*. 

## Installation
Clone this repository. Make sure you have node.js and npm installed. Navigate to the root of the project from your command line. Run the following command.

```
npm install
```

Before you can run the application you will have to obtain a token from google drive by following the steps behind [this link](https://developers.google.com/drive/api/v3/enable-drive-api). Click on the button "Enable the Drive API" and follow the instructions. Finally, download "credentials.json" by clicking on "Download Client Configuration" and copy it to the root folder of this project.


## Running 
Start the server with the following command. 
```
npm start
```

When running the application for the first time you will have to follow the instructions shown in the command line. Follow the link and enter the access key. This will generate an access token file automatically for the defined scope of this application.

## Usage
The server exposes an http post backend API.
curl -d "param1=value1&param2=value2" -X POST http://localhost:3000/sensor/
