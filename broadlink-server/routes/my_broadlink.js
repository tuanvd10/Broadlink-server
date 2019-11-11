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

    searchAllRMDevice().then(()=>
        res.end("Search Done: " + JSON.stringify(rmBroadlink.devices))
    );
});

router.get('/startLearning/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
	startLearning(deviceMAC, command).then((data) => {
        if(data!="Timeout") 
            data = data.toString('hex');
        res.end(data);
    })
});

router.get('/checkdata/:macAddress', function (req, res){
    var deviceMAC = req.params.macAddress;
    rmBroadlink.devices[deviceMAC].checkData();
    res.end();
});

router.get('/sendData/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
    sendData(deviceMAC,command).then( () => res.end());
});

/*API use for both REST or MQTT */
async function searchAllRMDevice(){
    rmBroadlink.discover();
    await sleep(10000);
    console.log("search done!");
}

async function startLearning(macAddress, command){
    var device = rmBroadlink.devices[macAddress];
    var data;
    device.enterLearning();
    await sleep(1000);
    data = await checkDataLearned(device);
    device.cancelLearn();
    return data;
}

async function sendData(deviceMAC, command){
    var device = rmBroadlink.devices[deviceMAC];
    /* maybe save in file base on MAC, cmd */
    var IRdata = device.cmdHashTable.get(command);
    device.sendData(IRdata);
    return;
}

async function checkDataLearned(device){
    var timeout = 10;
    while(!device.rawData && timeout>0){
        device.checkData();
        await sleep(1000);
    }
    if(timeout==0) return("Timeout")
    else {
        return device.rawData;
    }
}

module.exports = router;