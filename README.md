TradeOnChain is an open source blockchain platform designed to revolutionize international trade by digitizing and automating trade contracts. 

---

This project is composed by 3 components:

1. The frontend APP component allows the final users the following:
- User authentication via Internet Identity.
- Account creation and modification.
- Contract creation, modification and deletion.
- Contract status tracking and management.
- Interaction with external APIs for third-party logistics updates (TrackingMore)
- Interaction with external APIs for third-party payments updates (Transak)
- PDF generation for contract records.

2. The frontend API component allows the frontend APP component the following:
- Account creation and modification.
- Contract creation, modification and deletion.
- Contract status tracking and management.
- Interaction with external APIs for third-party logistics updates (TrackingMore)
- Interaction with external APIs for third-party payments updates (Transak)
- PDF generation for contract records.

3. The backend component is a canister on ICP blockckain and it allows the following:
- Secure storage and management of contracts.
- State management of contracts, reflecting the progress from creation to fulfilment.
- Signature verification and validation via Internet Identity.
- Allow secure off-ramp transactions sent and authenticated by frontend API.

---

INSTALLATION STEPS
1. Follow the instructions in the README file for the backend component
2. Follow the instructions in the README file for the frontend-api component
3. Follow the instructions in the README file for the frontend-app component