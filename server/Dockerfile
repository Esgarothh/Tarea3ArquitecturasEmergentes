# Use the official Node.js image as the base image
FROM node:14-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the server source code to the working directory
COPY server.js .

# Expose the port on which the server will listen
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]