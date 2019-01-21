#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error, print all commands.
set -ev

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

docker-compose -f docker-compose.yml down

#docker-compose -f docker-compose.yml up -d ca.example.com orderer.example.com peer0.org1.example.com peer1.org1.example.com peer0.org2.example.com peer1.org2.example.com couchdb
docker-compose -f docker-compose.yml up -d ca.example.com orderer.example.com peer0.org1.example.com peer1.org1.example.com peer0.org2.example.com peer1.org2.example.com couchdb1 couchdb2 couchdb3 couchdb4

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
export FABRIC_START_TIMEOUT=10
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}

# Create the channel
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/channel.tx

#copy mychannel.block into other containers
docker cp  $(docker inspect -f   '{{.Id}}' peer0.org1.example.com ):/opt/gopath/src/github.com/hyperledger/fabric/mychannel.block .
docker cp mychannel.block $(docker inspect -f   '{{.Id}}' peer1.org1.example.com ):/opt/gopath/src/github.com/hyperledger/fabric/
docker cp mychannel.block $(docker inspect -f   '{{.Id}}' peer0.org2.example.com ):/opt/gopath/src/github.com/hyperledger/fabric/
docker cp mychannel.block $(docker inspect -f   '{{.Id}}' peer1.org2.example.com ):/opt/gopath/src/github.com/hyperledger/fabric/

# Join peer0.org1.example.com to the channel.
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer1.org1.example.com peer channel join -b mychannel.block
docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b mychannel.block
docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer1.org2.example.com peer channel join -b mychannel.block