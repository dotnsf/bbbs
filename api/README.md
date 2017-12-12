# BBBS

Blockchain-ed BBS API

## Overview

BBS API with Blockchain(Hyperledger Fabric & Hyperledger Composer) technology.

You can use IBM Cloudant(http://cloudant.com/) as "fake" Blockchain if you don't have Hyperledger Fabric environment. 

## Pre-requisites

- Node.js V6.x

## Setup with Blockchain

If you use "real" Blockchain, you need to setup Hyperledger Fabric & Hyperledger Composer at first. You can refer here: 

- http://blog.idcf.jp/entry/hyperledger-fabric 
- http://dotnsf.blog.jp/archives/1066959724.html

Edit settings.js:

`exports.use_blockchain = **true**
exports.connectionProfile = 'hlfv1';
exports.businessNetworkIdentifier = 'bbbs-network';
exports.participantId = 'PeerAdmin';
exports.participantPwd = 'secret';
  :`


## Setup without Blockchain

If you don't have Blockchain environment, or you want to try Web UI, you can use IBM Cloudant as "fake" Blockchain. 

You may login to IBM Cloud(http://bluemix.net/) and create IBM Cloudant service instance at first.

Edit settings.js:

`exports.use_blockchain = **false**
  :

exports.cloudant_username = 'username';
exports.cloudant_password = 'password';
exports.cloudant_db = 'bcdb';

  :`

## Install

- $ npm install

- $ node app

## Licensing

This code is licensed under MIT.

## Copyright

2017 [K.Kimura @ Juge.Me](https://github.com/dotnsf) all rights reserved.

