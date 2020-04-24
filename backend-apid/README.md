# Resource Guardian Backend API Server

This backend acts as a gateway layer between any frontend client and the blockchain network. It exposes API services that can be consume by business workflow systems.

Following list of API are currently supported:

- /api/addhash: Scans and calculates hash of each resource and its tree structure. Then stores the result in state data.
- /api/gethash: Validates current resource + tree hash values against the state data
- /api/getreshash:

## Setup

- Build server using npm install

`cd backend-apid
npm install`

## Start Server

Use npm start command to start the server process. Once started it listens on port 3466 for incoming requests.

`cd backend-apid
npm start`
