import { FastifyInstance } from 'fastify';
import { RABBITMQ_URL } from '@/env';
import { TFnApplyToFastify } from '@/types/types';
import RabbitMQ from '@/rabbitmq';
import Queue from '@/rabbitmq/Queue';
import FanoutQueue from '@/rabbitmq/FanoutQueue';
import DefaultEventHandler from '@/events/DefaultEventHandler';
import ConsoleEventHandler from '@/events/ConsoleEventHandler';
import FanoutEventHandler from '@/events/FanoutEventHandler';

const callable: TFnApplyToFastify = async (app: FastifyInstance) => {
	await app.register(async fastify => {
		// register queues
		RabbitMQ.register(
			new Queue(
				'_rmq_default',
				[DefaultEventHandler, ConsoleEventHandler],
				{
					durable: false,
				}
			)
		);

		RabbitMQ.register(
			new FanoutQueue(
				'_rmq_fanout',
				[FanoutEventHandler, ConsoleEventHandler],
				{ durable: false }
			)
		);

		// connect to RabbitMQ and creates a channel
		await RabbitMQ.connect(RABBITMQ_URL);

		// // default exchange queue listener
		RabbitMQ.consumeFrom('_rmq_default');
		RabbitMQ.consumeFrom('_rmq_fanout');

		fastify.addHook('onClose', async () => {
			await RabbitMQ.close();
		});
	});
};

export default callable;
