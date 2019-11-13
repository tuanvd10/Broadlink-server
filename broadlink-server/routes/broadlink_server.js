var express = require('express');
const api = require('../my_module/api');

// get the reference of EventEmitter class of events module
var router = express.Router();

router.get('/testServer/', function (req, res){
    res.end("Hello");
});

router.get('/getListRMDevice/', function (req, res){
    res.end(JSON.stringify(api.getListRMDevice()));
});

router.get('/searchAllRMDevice/', function (req, res){
    api.searchAllRMDevice().then((devices)=>
        res.end("Search Done: " + JSON.stringify(devices))
    );
});

router.get('/startLearning/:macAddress/:client/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
	var client = req.params.client;
	api.startLearning(deviceMAC, command,client).then((data) => {
        if(data!="Timeout" || data!="err") 
            data = data.toString('hex');
        res.end(data);
    });
});

router.get('/sendData/:macAddress/:client/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
	var client = req.params.client;
	if(deviceMAC && command && client)
		api.sendData(deviceMAC,command,client)
			.then((result) => res.end(result!="err"?result.toString('hex'):result));
	else 
		res.end("missing argument");
});

module.exports = router;