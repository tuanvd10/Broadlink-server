var express = require('express');
const broadlink = require('../my_module/my_broadlink');
var HashTable = require('hashmap');

// get the reference of EventEmitter class of events module
var router = express.Router();
var rmBroadlink = new broadlink();

function sleep(ms){
     return new Promise(resolve=>{
         setTimeout(resolve,ms)
     })
}

router.get('/testServer/', function (req, res){
    res.end("Hello");
});

router.get('/getListRMDevice/', function (req, res){
    res.end(JSON.stringify(rmBroadlink.devices));
});

router.get('/searchAllRMDevice/', function (req, res){
	var listkey = [];
	var key;
    rmBroadlink.discover();
	
	// TODO: wait 5-10s
	 var timeout = 90000000;
	 //get data
    while(timeout>0){
        timeout-=1;
    }
	
    res.end("Search Done: " + JSON.stringify(rmBroadlink.devices));
});

router.get('/startLearning/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
    var timeout =900000000;
	var device = rmBroadlink.devices[deviceMAC];
	device.enterLearning(); 
     
	 //get data
    while(!device.rawData && timeout>0){
        if(timeout%10000000 == 0){
           device.checkData();
        }
        timeout-=1;
    }
	
    device.cancelLearn();
    console.log(timeout);
    res.end(timeout>0?JSON.stringify(device.rawData): "Timeout");
});

router.get('/enterLearning/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
    var rawData;
    var timeout = 90000000;
	rmBroadlink.devices[deviceMAC].learingCommand = command;
	rmBroadlink.devices[deviceMAC].enterLearning();
	
    res.end(timeout>0?JSON.stringify(rawData): "Timeout");
});

router.get('/quitLearningMode/:macAddress', function (req, res){
    var deviceMAC = req.params.macAddress;
    rmBroadlink.devices[deviceMAC].cancelLearn();
    res.end();
});


router.get('/checkdata/:macAddress', function (req, res){
    var deviceMAC = req.params.macAddress;
    rmBroadlink.devices[deviceMAC].checkData();
    res.end();
});

router.get('/sendData/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
    rmBroadlink.devices[deviceMAC].sendData(rmBroadlink.devices[deviceMAC].cmdHashTable.get(command));
    res.end();
});

module.exports = router;