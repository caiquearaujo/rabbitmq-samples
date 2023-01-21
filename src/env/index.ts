import { config } from 'dotenv';
import path from 'path';

export const ENVIRONMENT = process.env.NODE_ENV || 'development';
const DIR = path.resolve(__dirname, '../..');

config({
	path: `${DIR}/.env.${ENVIRONMENT}`,
});

export const NAME = process.env.NAME || 'api-server';
export const PORT = parseInt(process.env.PORT || '3000', 10);
export const HOST = process.env.HOST || '0.0.0.0';
export const RABBITMQ_URL =
	process.env.RABBITMQ_URL || 'amqp://localhost:5672';
