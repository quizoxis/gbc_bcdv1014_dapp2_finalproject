# Resource Guardian - Network Setup

# Technical Requirements

This project is build using Hyperledger Fabric 1.4 binaries and docker images found under Hyperledger Fabric Github repository.

## Pre-requisite

For information on how to setup the Hyperledger Fabric see the pre-requisite link https://hyperledger-fabric.readthedocs.io/en/release-1.4/prereqs.html

- Download Hyperledger Fabric Pre-requisite Script
`$ curl -O https://hyperledger.github.io/composer/v0.19/prereqs-ubuntu.sh`

- Change permissions
`$ chmod u+x prereqs-ubuntu.sh`

- Run pre-requisite script
`$ ./prereqs-ubuntu.sh`

- Logout and logon back in

Install Samples, Binaries and Docker Images
https://hyperledger-fabric.readthedocs.io/en/release-1.4/install.html

Invoke the following command to download and install Hyperledger Fabric 1.4 binaries and docker images.

`curl -sSL http://bit.ly/2ysbOFE | bash -s -- 1.4.6 1.4.6 0.4.18`

Add that to your PATH environment variable so that these can be picked up without fully qualifying the path to each binary. e.g.:

`export PATH=<path to download location>/bin:$PATH`


# Setup

## Start Network

`cd <path to download location>/fabric-samples/first-network/
./byfn.sh up -a -n -s couchdb -l node`


Run docker ps command to validate if nodes are up and running:

`docker ps --format="{{ .ID }}\t{{ .Names }}"`

## Create Identities

These identities are used by participating organizations in order to submit transactions to the network.


- Create Org1 Identities

Run the following commands to create Admin and User1 accounts.

`cd dokuguard-net/utils
node CreateAdminUser.js
node CreateUser.js
`

## Deploy Chaincode


- Copy chaincode/resourceguard directory to fabric-samples/chaincode directory


### Install

- Install chaincode for Org1 Peer0

`docker exec -e CORE_PEER_LOCALMSPID=Org1MSP -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt cli peer chaincode install -n resourceguard -v 1.0 -p /opt/gopath/src/github.com/chaincode/resourceguard -l node
`

- Install chaincode for Org1 Peer1

`docker exec -e CORE_PEER_LOCALMSPID=Org1MSP -e CORE_PEER_ADDRESS=peer1.org1.example.com:8051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt cli peer chaincode install -n resourceguard -v 1.0 -p /opt/gopath/src/github.com/chaincode/resourceguard -l node
`


- Install chaincode for Org2 Peer0

`docker exec -e CORE_PEER_LOCALMSPID=Org2MSP -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt cli peer chaincode install -n resourceguard -v 1.0 -p /opt/gopath/src/github.com/chaincode/resourceguard -l node
`

- Install chaincode for Org2 Peer1

`docker exec -e CORE_PEER_LOCALMSPID=Org2MSP -e CORE_PEER_ADDRESS=peer1.org2.example.com:10051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt cli peer chaincode install -n resourceguard -v 1.0 -p /opt/gopath/src/github.com/chaincode/resourceguard -l node
`


### Instantiate

`docker exec -e CORE_PEER_LOCALMSPID=Org1MSP -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp cli peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n resourceguard -l node -v 1.0 -c '{"Args":[]}' -P 'AND('\''Org1MSP.member'\'','\''Org2MSP.member'\'')' --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
`

- Validate Chaincode Instantiation

`docker exec -e CORE_PEER_LOCALMSPID=Org1MSP -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp cli peer chaincode list --instantiated -C mychannel --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
`
