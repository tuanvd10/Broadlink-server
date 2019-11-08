var express = require('express');
const broadlink = require('broadlinkjs-rm');
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
    res.end(rmBroadlink.devices);
});

router.get('/searchAllRMDevice/', function (req, res){
    rmBroadlink.discover();
    rmBroadlink.devices.forEach(device => {
        if(!device) continue;
        device.cmdHashTable = new HashTable();
        device.on('rawData', function (data) {
            console.log('receive data: ' + data);
            device.rawData = data;
        });
    });
    console.log(rmBroadlink.devices);
    res.end(rmBroadlink.devices);
});


/*request:
{
    macAddress: xxx,
    command: yyy
} */
router.get('/enterLearningMode/', async function (req, res){
    var deviceMAC = req.query.macAddress;
    var command = req.query.command;
    rmBroadlink.devices[deviceMAC].enterLearning();
    var timeout = 30;
    //get data
    while(!rmBroadlink.devices[deviceMAC].rawData && timeout>0){
        rmBroadlink.devices[deviceMAC].checkData();
        await sleep(1000);
        timeout-=1;
    }
    if(timeout>0){
        console.log(rmBroadlink.devices[deviceMAC].rawData);
        /* save to table: command-data */
        device.cmdHashTable.put(command,rmBroadlink.devices[deviceMAC].rawData);
    }

    rmBroadlink.devices[deviceMAC].rawData = null;
    rmBroadlink.devices[deviceMAC].cancelLearn();

    res.end(timeout>0?rmBroadlink.devices[deviceMAC].rawData: "Timeout");
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

router.post('/sendData/', function (req, res){
    var deviceMAC = req.query.macAddress;
    var command = req.query.command;
    var IRdata=rmBroadlink.devices[deviceMAC].cmdHashTable.get(command);
    //sendata
    /* 0x26: IR
    0x00: no repeat
    0x00,0x01,0x24,0x92: pulse length 
    0x0d,0x05: IR need in the end of payload*/
    var payload =[0x26,0x00,0x00,0x01,0x24,0x92].concat(IRdata).concat([0x0d, 0x05]);
    rmBroadlink.devices[deviceMAC].sendData(payload);

//  rmBroadlink.devices[deviceMAC].sendData(IRdata);
    console.log(rmBroadlink.devices);
    res.end();
});

module.exports = router;