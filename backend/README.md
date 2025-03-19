The backend component is a canister on ICP blockckain and it allows the following:
- Secure storage and management of contracts.
- State management of contracts, reflecting the progress from creation to fulfilment.
- Signature verification and validation via Internet Identity.
- Allow secure off-ramp transactions sent and authenticated by frontend API.

PREREQUISITES
1. Install the IC SDK (Linux/macOS)
  sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
2. Check the installed version
  dfx --version
3. Create a new identity
  dfx identity new test-user
4. Use the new identity
  dfx identity use test-user

NSTALLATION STEPS (LOCAL ICP REPLICA)
1. Start the replica
  dfx start --clean --background
2. Create the project
  dfx new icp-buyer-seller-contract-backend
3. Deploy the project
  dfx deploy
4. Get the CANISTER_ID and use it in the frontend-api and frontend-app component
5. Get the CANISTER_ETHERUM_ADDRESS making the following call
  dfx canister call icp-buyer-seller-contract-backend get_address
6. Stop the replica (when finished)
  dfx stop

INSTALLATION STEPS (ICP BLOCKCHAIN)
1. Build the project
  dfx build --ic
2. Install the canister 
2a. Delete previous data
  dfx canister install --mode reinstall icp-buyer-seller-contract-backend
2b. Keep previous data
  dfx canister install --mode upgrade --ic icp-buyer-seller-contract-backend
3. Get the CANISTER_ID and use it in the frontend-api and frontend-app component
4. Get the CANISTER_ETHERUM_ADDRESS making the following call
  dfx canister call icp-buyer-seller-contract-backend get_address --ic