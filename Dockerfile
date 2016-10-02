FROM mhart/alpine-node:latest

MAINTAINER Robert Stolarz <rob@letsbuildrockets.org>

# install git (needed for goatee while it's still in a git repo, sorry)
RUN apk update && apk add git

# grab dependencies if package.json has been modified
COPY package.json /tmp/package.json
RUN cd /tmp && npm install --production
RUN mkdir /app && cp -a /tmp/node_modules /app

WORKDIR /app
COPY . /app

EXPOSE 3000

CMD ["npm", "start"]
