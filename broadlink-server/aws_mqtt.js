var awsIot = require('aws-iot-device-sdk'); 
const api = require('./my_module/api');

var device = awsIot.device({
	keyPath: './certs/broadlink.private.key', 
	certPath: './certs/broadlink.cert.pem', 
	caPath: './certs/root-CA.crt', 
	region: 'us-east-1', 
	clientId: 'sdk-nodejs-c347ce22-4717-4190-8e89-ef701aa31a8ef',
	host: "a3oosh7oql9nlc-ats.iot.us-east-1.amazonaws.com",
	debug: false, // optional to see logs on console 
}); 

device.on('connect', function() { 
	console.log('device connected!'); 
	device.subscribe("broadlink/#"); 
}); 
 
 
 /* payload: 
 {
	 command:
	 mac:
	 client:
 }
 */
device.on('message', function(topic, payload) { 
	var parsedTopics = topic.split("/");
	payload = JSON.parse(payload.toString()); 
	//console.log('message from ', topic, JSON.stringify(payload)); 
	/*parse topic*/
	if(parsedTopics[0] !== "broadlink"){
		console.log("error topic" + topic);
	}else{
		switch (parsedTopics[1]){
			case "search":
				api.searchAllRMDevice().then((devices)=>
					console.log("Search Done: " + JSON.stringify(devices))
				);
				break;
			case "send_data":
				if(payload.mac && payload.command && payload.client)
					api.sendData(payload.mac, payload.command,payload.client).then((result) => console.log(result!="err"?result.toString('hex'):result));
				else 
					console.log("missing argument");
				break;
			case "learn":
				if(payload.mac && payload.command && payload.client)	
					api.startLearning(payload.mac, payload.command, payload.client).then((data) => {
						if(data!="Timeout" || data!="err") 
							data = data.toString('hex');
						console.log(data);
					});
				else 
					console.log("missing argument");
				break;
			default:
				console.log("no broker " + topic);
				break;
		}
	}
});

api.searchAllRMDevice().then((devices)=>
	console.log("Search Done: " )//+ JSON.stringify(devices))
);

function test(){
	console.log("testtttttttttt")
	var object = {
		"command": 1234, 
		"mac": "770f78d91f64",
		"client": null
	}
	device.publish("broadlink/search", JSON.stringify(object)); 
}

//setTimeout(test, 1000);