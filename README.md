# Blockchain-Enabled Land Authority

A beginner-friendly decentralized land registry built with Solidity, Hardhat, React, Ethers.js, and MetaMask.

This project lets a user:

- register land with an ID, owner address, and location
- transfer land ownership to another wallet
- verify whether a wallet owns a land record
- view all registered lands on a local Hardhat blockchain

## Tech Stack

- Solidity
- Hardhat
- Ethers.js
- React
- Vite
- MetaMask

## Project Structure

```text
.
|-- contracts/          # Solidity smart contracts
|-- scripts/            # Hardhat deployment script
|-- frontend/           # React frontend
|-- artifacts/          # Hardhat build output
|-- cache/              # Hardhat cache
|-- hardhat.config.js   # Hardhat configuration
|-- package.json        # Root scripts and dependencies
```

## Smart Contract Features

The `LandRegistry` contract supports:

- `registerLand(uint256 landId, address owner, string location)`
- `transferLand(uint256 landId, address newOwner)`
- `getLand(uint256 landId)`
- `getAllLands()`
- `verifyOwnership(uint256 landId, address owner)`

## Frontend Features

- connects to MetaMask
- switches or adds the local Hardhat network automatically
- shows the connected wallet address, network, and balance
- sends write transactions through MetaMask
- reads land records directly from the local Hardhat RPC

## Prerequisites

Make sure you have the following installed:

- Node.js 18+ recommended
- npm
- MetaMask browser extension

## Installation

Install dependencies in the project root:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

## Run the Project Locally

### 1. Start the local blockchain

Open a terminal in the project root and run:

```bash
npm run node
```

This starts Hardhat's local blockchain at:

```text
http://127.0.0.1:8545
```

It also prints funded test accounts and private keys. These are only for local development.

### 2. Compile the smart contract

In a new terminal:

```bash
npm run compile
```

### 3. Deploy the contract

Still in the project root:

```bash
npm run deploy
```

The deploy script writes the deployed contract address and ABI to:

```text
frontend/src/contract.js
```

### 4. Start the frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Vite will print the local frontend URL, usually:

```text
http://localhost:5173
```

## MetaMask Setup

Add the local Hardhat network in MetaMask with:

- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

Then import one of the funded Hardhat accounts shown by `npm run node`.

Example default Hardhat account:

- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

Warning: never use these test private keys on mainnet or any live network.

## How to Use

After the frontend is running:

1. Connect MetaMask.
2. Make sure MetaMask is on `Hardhat Local`.
3. Register a land record with:
   - land ID
   - owner wallet address
   - location
4. Transfer a registered land to a new owner.
5. Verify ownership by entering a land ID and wallet address.
6. Fetch all lands to see the current on-chain records.

## Available Scripts

### Root

```bash
npm run node
npm run compile
npm run deploy
npm run test
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
```

## Troubleshooting

### MetaMask shows the wrong network

Switch MetaMask to Chain ID `31337`.

### Contract not found

Make sure:

- `npm run node` is still running
- `npm run deploy` was run after starting the local node
- `frontend/src/contract.js` was updated by the deploy script

### Wallet has no ETH

Import one of the funded test accounts printed by Hardhat into MetaMask.

### Registered land does not appear

Wait for the transaction to be confirmed in MetaMask, then use `Fetch All Lands` again.

## Notes

- This project is designed for local development and learning.
- The contract does not include advanced land verification, admin roles, or production security controls.
- Data is stored only on the currently running local Hardhat chain unless deployed elsewhere.

## Future Improvements

- add automated contract tests
- add owner history tracking
- add access control and admin roles
- add input validation and better UI feedback
- deploy to a public testnet

## License

This project is for educational use unless you choose to add a separate license.
