#!/bin/bash

docker run -d \
  -p 5432:5432 \
  --name postgres-medusa \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=medusa-medusa-commerce-coordinator \
  postgres \

&& npx medusa db:migrate
