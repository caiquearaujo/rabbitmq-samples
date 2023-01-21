import { FastifyInstance } from 'fastify';
import { RABBITMQ_URL } from '@/env';
import ConsoleEventHandler from '@/events/ConsoleEventHandler';
import { TFnApplyToFastify } from '@/types/types';
import RabbitMQ from '@/rabbitmq';

const callable: TFnApplyToFastify = async (app: FastifyInstance) => {
	await app.register(async fastify => {
		// register events
		RabbitMQ.event(ConsoleEventHandler);

		// connect to RabbitMQ and creates a channel
		await RabbitMQ.connect(RABBITMQ_URL);

		// // default exchange queue
		await RabbitMQ.queue('rabbitmqapisample_default_exchange', {
			durable: false,
		});

		// // default exchange queue listener
		RabbitMQ.consume('rabbitmqapisample_default_exchange', msg => {
			RabbitMQ.handle(
				'rabbitmqapisample_default_exchange',
				msg?.content.toString() || ''
			);

			RabbitMQ.ack(msg);
		});

		console.log('RabbitMQ plugin registered');

		fastify.addHook('onClose', async () => {
			await RabbitMQ.close();
		});
	});
};

export default callable;
