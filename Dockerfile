# Stage 1: Use an official Node.js runtime as a parent image
# Using alpine for a smaller image size
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application source code to the working directory
# This includes server.js and the 'public' folder with index.html
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD [ "node", "server.js" ]