import { FastifyInstance } from 'fastify';
import { TFnApplyToFastify } from '@/types/types';
import RabbitMQ from '@/rabbitmq';
import ApplicationError from '@/exceptions/ApplicationError';
import Exchange, { IExchange } from '@/rabbitmq/Exchange';

const callable: TFnApplyToFastify = async (app: FastifyInstance) => {
	app.get('/status', (request, reply) => {
		reply.send({
			running: true,
		});
	});

	app.post('/publish/to/:type', async (request, reply) => {
		const { event, payload } = request.body as any;
		const { type } = request.params as any;

		let exchange: IExchange | undefined;

		switch (type) {
			case 'default':
				break;
			case 'direct':
				exchange = new Exchange('_rmq_direct', 'direct', {
					durable: false,
				});
				break;
			case 'fanout':
				exchange = new Exchange('_rmq_fanout', 'fanout', {
					durable: false,
				});
				break;
			case 'topic':
				exchange = new Exchange('_rmq_topic', 'topic', {
					durable: false,
				});
				break;
				break;
			default:
				throw new ApplicationError(
					421,
					'InvalidType',
					'Invalid RabbitMQ exchange type'
				);
		}

		let success: boolean;

		try {
			await RabbitMQ.publish(
				`_rqm_${type}`,
				{
					payload,
					event,
				},
				undefined,
				exchange
			);

			success = true;
		} catch (error) {
			success = false;
		}

		reply.send({
			success,
		});
	});
};

export default callable;
