# Use the official Node.js 18 image.
# https://hub.docker.com/_/node
FROM node:20-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
# If you add a package-lock.json, speed your build by switching to 'npm ci'.
# We need to install all dependencies (including devDependencies) because we need 'tsx' 
# or other build tools that might be in devDependencies for the ADK or local scripts.
# If you are sure only production deps are needed, use --only=production
RUN npm install

# Copy local code to the container image.
COPY . .

# Run the web service on container startup.
# We use npm start to run server.ts, which connects to DB and starts the server.
CMD [ "npm", "start" ]
