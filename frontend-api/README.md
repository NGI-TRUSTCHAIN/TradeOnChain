The frontend API component allows the frontend APP component the following:
- Account creation and modification.
- Contract creation, modification and deletion.
- Contract status tracking and management.
- Interaction with external APIs for third-party logistics updates (TrackingMore)
- Interaction with external APIs for third-party payments updates (Transak)
- PDF generation for contract records.

PREREQUISITES
1. Docker installed

INSTALLATION STEPS
1. Replace the environment variables in .env.docker file with your keys
2. Run docker-composer
    docker-compose up -d