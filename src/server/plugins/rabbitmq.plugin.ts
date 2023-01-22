import { FastifyInstance } from 'fastify';
import { RABBITMQ_URL } from '@/env';
import { TFnApplyToFastify } from '@/types/types';
import RabbitMQ from '@/rabbitmq';
import DefaultEventHandler from '@/events/DefaultEventHandler';
import ConsoleEventHandler from '@/events/ConsoleEventHandler';
import FanoutEventHandler from '@/events/FanoutEventHandler';
import DirectMedEventHandler from '@/events/DirectMedEventHandler';
import DirectHigEventHandler from '@/events/DirectHigEventHandler';
import TopicMotoEventHandler from '@/events/TopicMotoEventHandler';
import TopicCarEventHandler from '@/events/TopicCarEventHandler';
import Queue from '@/rabbitmq/Queue';
import Consumer from '@/rabbitmq/Consumer';
import Exchange from '@/rabbitmq/Exchange';

/* eslint-disable max-statements */
const callable: TFnApplyToFastify = async (app: FastifyInstance) => {
	await app.register(async fastify => {
		// register queues

		// default exchange
		const defaultQueue = new Queue('_rmq_default', { durable: false });
		const defaultConsumer = new Consumer(defaultQueue).handlers([
			DefaultEventHandler,
			ConsoleEventHandler,
		]);

		// fanout exchange
		const fanoutQueue = new Queue('_rmq_fanout', {
			exclusive: true,
		}).exclusive();

		const fanoutExchange = new Exchange('_rmq_fanout', 'fanout', {
			durable: false,
		});

		const fanoutConsumer = new Consumer(
			fanoutQueue,
			fanoutExchange
		).handlers([FanoutEventHandler, ConsoleEventHandler]);

		// direct exchange
		const directQueue = new Queue('_rmq_direct', {
			exclusive: true,
		}).exclusive();

		const directExchange = new Exchange('_rmq_direct', 'direct', {
			durable: false,
		});

		const directMedConsumer = new Consumer(directQueue, directExchange)
			.handlers([DirectMedEventHandler, ConsoleEventHandler])
			.listenTo(new Queue('info'), new Queue('warn'));

		const directHigConsumer = new Consumer(directQueue, directExchange)
			.handlers([DirectHigEventHandler, ConsoleEventHandler])
			.listenTo(new Queue('critial'), new Queue('error'));

		// topic exchange
		const topicQueue = new Queue('_rmq_topic', {
			exclusive: true,
		}).exclusive();

		const topicExchange = new Exchange('_rmq_topic', 'topic', {
			durable: false,
		});

		const topicCar = new Consumer(topicQueue, topicExchange)
			.handlers([TopicCarEventHandler, ConsoleEventHandler])
			.listenTo(new Queue('car.*'));

		const topicMoto = new Consumer(topicQueue, topicExchange)
			.handlers([TopicMotoEventHandler, ConsoleEventHandler])
			.listenTo(new Queue('moto.*'));

		// connect to RabbitMQ and creates a channel
		await RabbitMQ.connect(RABBITMQ_URL);

		// prepare consumers
		RabbitMQ.consumers(
			defaultConsumer,
			fanoutConsumer,
			directMedConsumer,
			directHigConsumer,
			topicCar,
			topicMoto
		);

		await RabbitMQ.subscribe();

		fastify.addHook('onClose', async () => {
			await RabbitMQ.close();
		});
	});
};

export default callable;
