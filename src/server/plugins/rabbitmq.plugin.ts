import { FastifyInstance } from 'fastify';
import { RABBITMQ_URL } from '@/env';
import ConsoleEventHandler from '@/events/ConsoleEventHandler';
import { TFnApplyToFastify } from '@/types/types';
import RabbitMQ from '@/rabbitmq';
import Queue from '@/rabbitmq/Queue';

const callable: TFnApplyToFastify = async (app: FastifyInstance) => {
	await app.register(async fastify => {
		// register events
		RabbitMQ.registerEvent(ConsoleEventHandler);

		// register queues
		RabbitMQ.registerQueue(
			new Queue('rabbitmqapisample_default_exchange', {
				durable: false,
			})
		);

		// connect to RabbitMQ and creates a channel
		await RabbitMQ.connect(RABBITMQ_URL);

		// // default exchange queue listener
		RabbitMQ.consumeFrom('rabbitmqapisample_default_exchange');

		fastify.addHook('onClose', async () => {
			await RabbitMQ.close();
		});
	});
};

export default callable;
