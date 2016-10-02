#!/bin/bash
echo "[dev-helper] Building and starting containers..."
docker-compose -p lbrstorefront build
nodemon --ext "js,html,css,json" --exec "docker-compose up" < /dev/null
