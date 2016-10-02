#!/bin/bash
function cleanup {
	docker-compose down
	exit
}
echo "[dev-helper] Building and starting containers..."
docker-compose -p lbrstorefront build
trap cleanup EXIT INT
docker-compose up -d
watch "docker restart lbrstorefront_web-store_1" --ignoreDotFiles
