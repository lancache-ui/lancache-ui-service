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

## Docker

Alternatively you can just build the docker image and not have to install all the node items. 

### Build Image

```
docker build --tag lancache-ui-service .
```

### Run Image
Make sure you mount the path to where your lancache logs folder lives

```
docker run --rm --name lancache-ui-service -d -p3002:3002 -v /path/to/lancache:/lancache lancache-ui-service
```
