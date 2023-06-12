const axios = require('axios');

// Replace <sensor_api_key> with your actual sensor API key
const sensorApiKey = '123';

// Sample JSON data to send
const jsonData = [
  { "valor1": "temperatura01" },
  { "sensor": "on" }
];

// Function to send the data to the server
function sendData() {
  const data = {
    api_key: sensorApiKey,
    json_data: jsonData
  };

  axios.post('http://localhost:3000/upload-data', data)
    .then(response => {
      console.log('Data sent successfully');
    })
    .catch(error => {
      console.error('Error sending data:', error.message);
    });
}

// Send the data initially
sendData();

// Schedule sending the data every 30 seconds
setInterval(sendData, 60 * 1000);