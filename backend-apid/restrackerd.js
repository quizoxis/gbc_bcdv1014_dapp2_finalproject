/* *************************************************************
 * restrackerd.js                                              *
 *  - Resource Guardian API Server                             *
 *
 *
 * *************************************************************
*/

// Required Packages
var fs = require('fs');
var path = require('path');
const { Keccak } = require('sha3');
const { FileSystemWallet, Gateway } = require('fabric-network');
var express = require("express");
var bodyParser = require("body-parser");


/* *************************************************************
 * * API Server Configuration                                  *
 * *************************************************************
*/
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  // Website to connect to. * indicates 'all'
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Methods to allow access
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers to allow access
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Send cookies
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Move on to the next layer
  next();
});

// Server Startup Listening Port
var server = app.listen(process.env.PORT || 3600, function () {
  var port = server.address().port;
  console.log("Backend now active listening on port", port);
});


/* *************************************************************
 * * Global Application Variables                              *
 * *************************************************************
*/
const ccpPath = '/zhlf/fabric-samples/first-network/connection-org1.json';
const netChannelName = 'mychannel';
const userWalletPath = '/zhlf/fabric-samples/dokuguard-net/wallet';
const walletUsername = 'user1';


/* *************************************************************
 * * Server Utility Functions                                  *
 * *************************************************************
*/


/* *************************************************************
 * fsWalkPath
 * - Utility function to recursively retrieve list of resources
 *   under a given filesystem path
 *
 * Parameters:
 *  dir  : string : Path of file system to scan
 *  done : sring  : Call back function once scan is complete
 *
 * Returns:
 *  List of resources found with full path info
 *
 * *************************************************************
*/
var fsWalkPath = function(path2Scan, done) {
  var results = [];

  fs.readdir(path2Scan, function(err, list) {
    if (err) return done(err);

    var pending = list.length;
    if (!pending) return done(null, results);

    list.forEach(function(resource) {
      resource = path.resolve(path2Scan, resource);
      fs.stat(resource, function(err, stat) {
        if (stat && stat.isDirectory()) {
          fsWalkPath(resource, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(resource);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

/* *************************************************************
 * addResHash
 * - Add hashes as state data
 * - Calls chaincode: resourceguard:addResourceHash
 *
 * Parameters:
 *  pHash  : string : Hash value of the resource tree
 *  dHash  : string : Hash value of the resource
 *
 * Returns:
 *  Error if it fails to add state data
 *
 * *************************************************************
*/
async function addResHash (pHash,dHash) {
  try {

    const userWalletExists = await userWalletPath.exists(walletUsername);

    if (!userWalletExists) {
      console.log(`${walletUsername} wallet not found. Hint: Use the CreateUser.js utility to create a wallet`);
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, {
      userWalletPath,
      identity: walletUsername,
      discovery: {
        asLocalhost: true,
        enabled: true
      }
    });

    const netChannel = await gateway.getNetwork(netChannelName);
		const ccResourceGuard = netChannel.getContract('resourceguard');

    // Chaincode Call: addResourceHash
		await ccResourceGuard.submitTransaction('addResourceHash',resTreeHash,resHash);

    console.log(`Chaincode:resourceguard:addResourceHash called with: ${resTreeHash} ${resHash}`);

    // Disconnect from gateway
		await gateway.disconnect();

  } catch (error) {
    console.error(`Chaincode returned error: ${error}`);
    process.exit(1);
  }
}

/* *************************************************************
 * addResTreeHash
 * - Stores hashes of the entire tree as state data
 * - Calls chaincode: resourceguard:addResourceTreeHash
 *
 * Parameters:
 *  resMClockHash  : string : Hash of all modified times of resources
 *  resTreeHash    : string : Hash value of the resource tree structure
 *
 * Returns:
 *  Error if it fails to add state data
 *
 * *************************************************************
*/
async function addResTreeHash(resMClockHash, resTreeHash) {

  try {
    const userWalletExists = await userWalletPath.exists(walletUsername);

    if (!userWalletExists) {
      console.log(`${walletUsername} wallet not found. Hint: Use the CreateUser.js utility to create a wallet`);
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, {
      userWalletPath,
      identity: walletUsername,
      discovery: {
        asLocalhost: true,
        enabled: true
      }
    });

    const netChannel = await gateway.getNetwork(netChannelName);
    const ccResourceGuard = netChannel.getContract('resourceguard');

    var today = new Date();
    var dateTime = Date.UTC(today.getFullYear(), today.getMonth()+1, today.getDate(), today.getHours(),today.getMinutes(),today.getSeconds());

    // Chaincode Call: addResourceTreeHash
    await ccResourceGuard.submitTransaction('addResourceTreeHash',dateTime.toString(),resMClockHash,resTreeHash);
    console.log(`Chaincode:resourceguard:addResourceTreeHash called with hash ${dateTime}`);

    // Disconnect from gateway
    await gateway.disconnect();

    // return
    return dateTime.toString();

  } catch (error) {
    console.error(`Chaincode failure: ${error}`);
    process.exit(1);
  }

};


/* *************************************************************
 * verifyResTreeHash
 * - Fetches data stored from state data and compares with current values
 * - Calls chaincode: resourceguard:getResourceTreeHash
 *
 * Parameters:
 *  clockTick     : string : Time of hash record
 *  currTreeHash  : string : Current hash value of resource motified times
 *  currFTreeHash : string : Current hash value of resource
 *
 * Returns:
 *  Error if it fails to add state data
 *
 * *************************************************************
*/
async function verifyResTreeHash (clockTick, currTreeHash, currFTreeHash) {

  try {
    const userWalletExists = await userWalletPath.exists(walletUsername);

    if (!userWalletExists) {
        console.log(`walletUsername wallet not found. Hint: Use the CreateUser.js utility to create a wallet`);
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, {
      userWalletPath,
      identity: walletUsername,
      discovery: {
        asLocalhost: true,
        enabled: true
      }
    });

    const netChannel = await gateway.getNetwork(netChannelName);
    const ccResourceGuard = netChannel.getContract('resourceguard');

    // Get State Data
    // Chaincode Call: getResourceTreeHash
    const stateData = await ccResourceGuard.evaluateTransaction('getResourceTreeHash',clockTick);
    var stateFTreeHash = stateData.toString('ascii',115,179);
    var stateTreeHash = stateData.toString('ascii',14,78);

    console.log(`Chaincode:resourceguard:getResourceTreeHash evalutateTransaction completed`);
    await gateway.disconnect();

    // Compare Hash values
    var stateResult;

    if(stateTreeHash != currTreeHash || stateFTreeHash != currFTreeHash) {
			stateResult = 'Tampered'
		} else {
      stateResult = 'Not Tampered'
    }

    return stateResult;

  } catch (error) {
    console.error(`Chaincode failure: ${error}`);
    process.exit(1);
  }

}


// bRead ->
/* *************************************************************
 * verifyResHash
 * - Compare current hash vale of a resource against stored hash
 * - Calls chaincode: resourceguard:getResourceHash
 *
 * Parameters:
 *  resTreeHash  : string : Hash of resource path
 *  currResHash  : string : Current hash value of resource
 *
 * Returns:
 *  Error if it fails to add state data
 *
 * *************************************************************
*/
async function verifyResHash (resTreeHash,currResHash) {

  try {
    const userWalletExists = await userWalletPath.exists(walletUsername);

    if (!userWalletExists) {
        console.log(`walletUsername wallet not found. Hint: Use the CreateUser.js utility to create a wallet`);
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, {
      userWalletPath,
      identity: walletUsername,
      discovery: {
        asLocalhost: true,
        enabled: true
      }
    });

    const netChannel = await gateway.getNetwork(netChannelName);
    const ccResourceGuard = netChannel.getContract('resourceguard');

    // Get State Data
    // Chaincode Call: getResourceTreeHash
    const stateData = await ccResourceGuard.evaluateTransaction('getResourceHash',resTreeHash);
    var stateResHash = stateData.toString('ascii',12,76);

    console.log(`Chaincode:resourceguard:getResourceHash evalutateTransaction completed Result:${stateData.toString('ascii',12,76)}`);
    await gateway.disconnect();

    // Compare Hash values
    var stateResult;
    if (stateResHash == currResHash) {
      stateResult = 'Not Tampered'
    } else {
      stateResult = 'Tampered'
    }
    return stateResult;

  } catch (error) {
    console.error(`Chaincode failure: ${error}`);
    process.exit(1);
  }
}

/* *************************************************************
 * * API Services                                              *
 * *************************************************************
*/


/* *************************************************************
 * /api/addhash
 * - Scans and caluculates hash of each resource and its tree
 *   structure. Then stores the result in state data.
 *
 * Parameters:
 * respath  : string : Resource path to validate
 *
 * Returns:
 * JSON Object contains resource status
 *
 * *************************************************************
*/
app.post("/api/addhash", function(request , response) {

  // Parse Request Data
  var reqResPath = request.body.respath;

  var resItemTS = [];
  var resModTime;
  var jsonResult;

  fsWalkPath(reqResPath,function(errMsg,fsData) {

    if (fsData) {

      var resList = fsData;
      var resCount = 1;

      resList.forEach(function (resItem) {

        var resPathHash = new Keccak(256);
        resPathHash.update(resItem);

        var resPathHash = resPathHash.digest('hex');
        var resItemStats = fs.statSync(resItem);
        resItemTS.push(resItemStats.mtime);

        var resHash = new Keccak(256);
        var s = fs.ReadStream(resItem);

        s.on('data', function(d) {
          resHash.update(d);
        });

        s.on('end', function() {
          var resHash = resHash.digest('hex');

          // Write resource hash to the blockchain
          addResHash(resPathHash,resHash);

          var resTCount = resCount;
          if (resTCount == resList.length) {

            var resTreeHash = new Keccak(256);
            resTreeHash.update(resList.toString());
            var resTreeHashHex = resTreeHash.digest('hex');

            var resModTHash = new Keccak(256);
            resModTHash.update(resItemTS.toString());
            var resModTHashHex = resModTHash.digest('hex');

            addResTreeHash(resTreeHashHex,resModTHashHex).then(function(resModTime) {
              jsonResult = JSON.stringify({
                resources: resList,
                resModTHashHex: resModTHashHex,
                resTreeHashHex: resTreeHashHex,
                resModTime: resModTime});
              response.send(jsonResult);
            });
          }
        });
        resCount++;
      }); // end of for-each

    } else {
      console.log(errMsg);
      jsonResult = JSON.stringify({Error: errMsg});
      response.send(jsonResult);
    }
  });
});

/* *************************************************************
 * /api/gethash
 * - Validates current resource + tree hash values against the
 *   state data
 *
 * Parameters:
 * respath  : string : Resource path to validate
 * modtime  : string : Timestamp values of recorded state data
 *
 * Returns:
 * JSON Object contains resource status
 *
 * *************************************************************
*/
app.post("/api/gethash", function(request , response) {

  // Parse Request Data
  var reqResPath = request.body.respath;
  var reqModTime = request.body.modtime;

  var resItemTS = [];
  var jsonResult;

  fsWalkPath(reqResPath,function(errMsg,fsData) {

    if (fsData) {
      var resList = fsData;
      var resCount = 1;

      resList.forEach(function (resItem) {

        var resItemStats = fs.statSync(resItem);
        resItemTS.push(resItemStats.mtime);

        var resTCount = resCount;
        if (resTCount == resList.length) {

          var resTreeHash = new Keccak(256);
          resTreeHash.update(resList.toString());
          var resTreeHashHex = resTreeHash.digest('hex');

          var resModTHash = new Keccak(256);
          resModTHash.update(resItemTS.toString());
          var resModTHashHex = resModTHash.digest('hex');

          verifyResTreeHash(reqModTime, resModTHashHex, resTreeHashHex).then(function(err,res) {
            if (res) {
              jsonResult = JSON.stringify({result: res,resList: resList });
              response.send(jsonResult);
            } else {
              jsonResult = JSON.stringify({result: err, resList: resList});
              response.send(jsonResult);
            }
          })
        }
        resCount++;
      }); // END: for-each resource loop
    }
  });
});


/* *************************************************************
 * /api/getreshash
 * - Look for resource that have been modified or changed
 *   Provides detail list of resources that have changed
 *
 * Parameters:
 * respath  : string : Resource path to validate
 * resources: string : List of resources
 *
 * Returns:
 * JSON Object contains resource status
 *
 * *************************************************************
*/
app.post("/api/getreshash", function(request , response) {

  // Parse Request Data
  var reqResPath = request.body.respath;
  var reqResList = request.body.resources;

  var resObject = [];
  var jsonResult;

  reqResList.forEach(function (resItem) {

    var resPathHash = new Keccak(256);
    resPathHash.update(resItem);
    var resPathHashHex = resPathHash.digest('hex');

    var resHash = new Keccak(256);
    var s = fs.ReadStream(resItem);

    s.on('data', function(d) {
      resHash.update(d);
    });

    s.on('end', function() {
      var resHashHex = resHash.digest('hex');

      verifyResHash(resPathHashHex, resHashHex).then(function(res) {
        if (res) {
          resObject.push({resource: resItem, status: res});

          if (resObject.length == reqResList.length) {
            jsonResult = JSON.stringify({res: resObject});
            response.send(jsonResult);
          }
        }
      });
    });
  });
});
