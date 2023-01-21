# RabbitMQ Samples

> This repository is for study purposes. Not ready for the production environment.

RabbitMQ is open source message broker software (sometimes called message-oriented middleware) that implements the Advanced Message Queuing Protocol (AMQP). This repository implements RabbitMQ into a Fastify API.

## Git Hooks

This repository uses the `husky` library to subscribe to git hooks locally. After cloning it, you must run `npx husky install` on the code base to enable all hooks.

- On pre-commit: will format with Prettier, lint with ESLint and test with Jest.

## Docker

> ⚠️ This application depends on other applications. It's better to use Docker Composer or similar to deploy it. See on Compose section.

### Standalone

If you want to keep it as an individual container you must share at least the network, by default it's `bride`.

1. Run a RabbitMQ container: `docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.11-management`;
2. Build docker image for this API `docker build -t rabbitmq-samples-api -f ./Dockerfile.dev .`;
3. Run image in background, mapping the application port and specifying a shared network: `docker run -d -p 3000:3000 --volume $(pwd):/usr/app --volume /usr/app/node_modules rabbitmq-samples-api`;
4. After running, you may see it's running with `docker ps` command.

> When usign docker, you may set env variables inline command with `-e` argument.

# Compose

You may want to use the `docker-compose.yml` in this folder to up all systems together.

> When use docker compose, define env variables on `docker-compose.yml`.
