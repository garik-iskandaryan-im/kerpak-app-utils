FROM node:16.14.2-alpine as build

# Create app directory
WORKDIR /usr/src/app
# Install app dependencies
COPY package.json ./
COPY package-lock.json ./

# debug
# RUN apk update && apk add bash
# docker build -t mynewimage .
# docker run -it mynewimage /bin/bash

RUN apk add git

RUN npm --version
RUN npm ci --silent
RUN npm prune --production
# Copy app source code
COPY . .

#Expose port and start application
EXPOSE 4000

## Launch the wait tool and then your application

# CMD npm start
CMD ["npm","start"]
