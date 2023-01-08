# lancache-ui-service

Backend service for lancache-ui frontend. Implements log monitor, GQL, and DB caching

## Install dependencies

```bash
# Installing NodeJS via Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash

# Installing NodeJS
nvm install v18.12.1

# Install PNPM
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Install project dependencies
pnpm install
```

## Configure
Rename `.env.example` to `.env`, and point `logFileLocation` to point to your Lancache's `access.log`

## Start service

```
pnpm start
```
