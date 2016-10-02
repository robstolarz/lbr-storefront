#!/bin/bash
echo "[dev-helper] Building and starting containers..."
docker-compose -p lbrstorefront build
watch "docker-compose down && docker-compose up" --ignoreDotFiles
