var express = require('express');
const api = require('../my_module/api');

// get the reference of EventEmitter class of events module
var router = express.Router();

router.get('/testServer/', function (req, res){
    res.end("Hello");
});

router.get('/getListRMDevice/', function (req, res){
    res.end(api.getListRMDevice());
});

router.get('/searchAllRMDevice/', function (req, res){
    api.searchAllRMDevice().then((devices)=>
        res.end("Search Done: " + JSON.stringify(devices))
    );
});

router.get('/startLearning/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
	api.startLearning(deviceMAC, command).then((data) => {
        if(data!="Timeout" || data!="err") 
            data = data.toString('hex');
        res.end(data);
    });
});

router.get('/sendData/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
    api.sendData(deviceMAC,command).then((result) => res.end(result!="err"?result.toString('hex'):result));
});

module.exports = router;