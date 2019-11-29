# GDriveToCSVDump
A simple server written in node.js to dump sensor values into a CSV on Google Drive. A new subfolder is generated every day and values are stored in a CSV file identified by the sensor identifier.

*Timestamp integrity is not secured and lines are just appended to the CSV file for every event*. 

## Installation
Clone this repository. Make sure you have node.js and npm installed. Navigate to the root of the project from your command line. Run the following command.

```
npm install
```

Before you can run the application you will have to obtain a token from google drive by following the steps behind [this link](https://developers.google.com/drive/api/v3/enable-drive-api). After creating an app, genereate OAuth Client ID credentials and download the credentials file. Rename the file to credentials.json and copy it to the root folder of this project.


## Running 
Start the server with the following command. It will run on port 4000.
```
npm start
```

When running the application for the first time you will have to follow the instructions shown in the command line. Follow the link and enter the access key. This will generate an access token file automatically for the defined scope of this application.

## Usage
The server exposes an http post backend API and accepts form url encoded content. Make sure to add the appropriate header to your request. You can use the following curl command to test the API from the command line.

```
curl -d "sensorId=DS18B20LivingRoom&timestamp=1574517436139&value=23.4&unit=Celsius" -X POST http://localhost:4000/event/
```
**Important: Google's courtesy limit of the drive API is at 1'000'000 calls per day and 1'000 requests per 100 seconds. Keep this in mind when pushing data to the server. To ensure no file syncing issues happen when replacing the CSV file internally there is an artifical request limiter of 15 seconds in place for every sensor id. Requesting the API more than every 15 seconds for a certain sensor id will result in an http 409.**

## Arduino Usage Example
As you might want to use this in an embedded scenario, here is an **untested** example code for Arduino (ESP32). The timestamp is currently not obtained and hardcoded inside the POST request as you might tell from the code below.
```c
#include <WiFi.h>
#include <HTTPClient.h>
 
const char* ssid = "yourNetworkName";
const char* password =  "yourNetworkPassword";
 
void setup() {
  Serial.begin(115200);
  delay(4000);   //Delay needed before calling the WiFi.begin
 
  WiFi.begin(ssid, password); 
 
  while (WiFi.status() != WL_CONNECTED) { //Check for the connection
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }
 
  Serial.println("Connected to the WiFi network");
}
 
void loop() {
  if(WiFi.status()== WL_CONNECTED){   //Check WiFi connection status
    HTTPClient http;   
 
    http.begin("http://your_servers_ip:4000/event");  //Specify destination for HTTP request
    http.addHeader("Content-Type", "application/x-www-form-urlencoded"); //Specify content-type header
 
    // TODO: obtain timestamp
    int httpResponseCode = http.POST("sensorId=DS18B20LivingRoom&timestamp=1574517436139&value=23.4&unit=Celsius"); //Send the actual POST request
 
    if (httpResponseCode == 200) {
      // success
    } else {
      // something went wrong
    }
    
    http.end();  //Free resources
  } else {
    Serial.println("Error in WiFi connection");   
  }

  delay(20000);  //Send a request every 20 seconds
}
```

## Feature List
- Generate Dynamic Pages from Sensors (e.g. overview of all sensors and also data visualization)

## Error Handling
**Error loading client secret file: [Error: ENOENT: no such file or directory, open '...\credentials.json']**

Please make sure to follow the steps under "Installation" to add a credentials.json to the projects root.
