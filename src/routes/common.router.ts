import { FastifyInstance } from 'fastify';
import { TFnApplyToFastify } from '@/types/types';
import RabbitMQ from '@/rabbitmq';

const callable: TFnApplyToFastify = async (app: FastifyInstance) => {
	app.get('/status', (request, reply) => {
		reply.send({
			running: true,
		});
	});

	app.post('/publish/to/default', async (request, reply) => {
		const { event, payload } = request.body as any;

		let success: boolean;

		try {
			await RabbitMQ.produceTo('_rmq_default', {
				payload,
				event,
			});

			success = true;
		} catch (error) {
			success = false;
		}

		reply.send({
			success,
		});
	});

	app.post('/publish/to/fanout', async (request, reply) => {
		const { event, payload } = request.body as any;

		let success: boolean;

		try {
			await RabbitMQ.produceTo('_rmq_fanout', {
				payload,
				event,
			});

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
