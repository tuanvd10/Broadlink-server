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
    console.log(rmBroadlink.devices);
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


/*request:
{
    macAddress: xxx,
    command: yyy
} */
router.get('/startLearning/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
    var rawData;
    var timeout = 90000000;
	
	rmBroadlink.devices[deviceMAC].enterLearning(); 
     
	 //get data
    while(!rmBroadlink.devices[deviceMAC].rawData && timeout>0){
        if(timeout%1000000 == 0){
            rmBroadlink.devices[deviceMAC].checkData();
        }
        timeout-=1;
    }
	
    rawData = rmBroadlink.devices[deviceMAC].rawData;
	
    if(timeout>0){
        console.log(rawData);
        /* save to table: command-data */
        device.cmdHashTable.put(command,rmBroadlink.devices[deviceMAC].rawData);
    }

    rmBroadlink.devices[deviceMAC].rawData = null;
    rmBroadlink.devices[deviceMAC].cancelLearn();
    console.log(timeout);
    res.end(timeout>0?JSON.stringify(rawData): "Timeout");
});

router.get('/enterLearning/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
    var rawData;
    var timeout = 90000000;
	rmBroadlink.devices[deviceMAC].learingCommand = command;
	rmBroadlink.devices[deviceMAC].enterLearning();
	
    while(!rmBroadlink.devices[deviceMAC].rawData){

	}
	
    res.end(timeout>0?JSON.stringify(rawData): "Timeout");
});

router.get('/quitLearningMode/:macAddress', function (req, res){
    var deviceMAC = req.params.macAddress;
    rmBroadlink.devices[deviceMAC].cancelLearn();
    console.log(rmBroadlink.devices);
    res.end();
});

/*
router.get('/getDataLearned/:macAddress/', function (req, res){
    var deviceMAC = req.params.macAddress;
    rmBroadlink.devices[deviceMAC].checkData();
    //get data
    while(!rmBroadlink.devices[deviceMAC].rawData){

    }
    
    rmBroadlink.devices[deviceMAC].rawData = null;
    console.log(rmBroadlink.devices);
    res.end();
});
*/

router.get('/sendData/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
    var IRdata=rmBroadlink.devices[deviceMAC].cmdHashTable.get(command);
	//var data = 2600860068360e28072d0b10051307130b2a06120a100e250c290c0f072c0d0c0b0f09290b290c0e0a290c280c0f0b280c100a0f0812090f0b100c280c0c0e0d0c0f0c280d0b0d0d0b0e0c0f090f0a0f0a0e0c0e082a0e280a0e0c100c270b0f0a100b0e0b270e2a0a0e0a100b0c0d0d0c0e0a0e0d0c0e0e0a0e0a100b0d0a28100e0b0f082b0c000d050000;
    //sendata
    /* 0x26: IR
    0x00: no repeat
    0x....: pulse length 
    0x0d,0x05: IR need in the end of payload */

    var payload =[0x26,0x00,0x00,0x01,0x24,0x92].concat(IRdata).concat([0x0d, 0x05]);
    rmBroadlink.devices[deviceMAC].sendData(payload);

//  rmBroadlink.devices[deviceMAC].sendData(IRdata);
    console.log(rmBroadlink.devices);
    res.end();
});

module.exports = router;