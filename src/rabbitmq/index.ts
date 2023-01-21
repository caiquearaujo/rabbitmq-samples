import amqp from 'amqplib';
import ApplicationError from '@/exceptions/ApplicationError';
import Queue from './Queue';

export interface EventData {
	event: string;
	payload: Record<string, any>;
}

export type EventHandler = (
	queue: string,
	data: EventData
) => Promise<boolean>;

export default class RabbitMQ {
	protected static conn?: amqp.Connection;

	protected static channels: {
		consumer: amqp.Channel;
		producer: amqp.Channel;
	};

	protected static queues: Record<string, Queue> = {};

	protected static e: Array<EventHandler> = [];

	public static async connect(host: string): Promise<void> {
		if (RabbitMQ.conn) {
			return;
		}

		try {
			RabbitMQ.conn = await amqp.connect(host);

			RabbitMQ.channels.consumer = await RabbitMQ.conn.createChannel();
			RabbitMQ.channels.producer = await RabbitMQ.conn.createChannel();
		} catch (error) {
			console.log(error);
			throw new ApplicationError(
				500,
				'RabbitMQ',
				'Failed to start a connection'
			);
		}
	}

	public static registerEvent(e: EventHandler) {
		RabbitMQ.e.push(e);
		return RabbitMQ;
	}

	public static registerQueue(queue: Queue) {
		this.queues[queue.name()] = queue;
		return RabbitMQ;
	}

	public static async consumeFrom(queue: string) {
		if (!RabbitMQ.queues[queue]) {
			throw new ApplicationError(
				500,
				'RabbitMQ',
				`Queue ${queue} is not registered`
			);
		}

		RabbitMQ.queues[queue].assert(RabbitMQ.channels.consumer);
		RabbitMQ.channels.consumer.consume(
			queue,
			msg => {
				if (msg) {
					RabbitMQ.handle(queue, msg.content.toString())
						.then(
							() => {
								RabbitMQ.channels.consumer.ack(msg);
							},
							() => {
								RabbitMQ.channels.consumer.nack(msg);
							}
						)
						.catch(() => {
							RabbitMQ.channels.consumer.nack(msg);
						});
				}
			},
			{
				noAck: false,
			}
		);
	}

	public static async produceTo(
		queue: string,
		message: EventData
	): Promise<void> {
		if (!RabbitMQ.queues[queue]) {
			throw new ApplicationError(
				500,
				'RabbitMQ',
				`Queue ${queue} is not registered`
			);
		}

		RabbitMQ.queues[queue].assert(RabbitMQ.channels.producer);
		RabbitMQ.queues[queue].send(
			RabbitMQ.channels.producer,
			JSON.stringify(message)
		);
	}

	public static async close(): Promise<void> {
		if (RabbitMQ.conn) {
			await RabbitMQ.channels.consumer.close();
			await RabbitMQ.channels.producer.close();
			await RabbitMQ.conn.close();
		}
	}

	public static async handle(
		queue: string,
		message: string
	): Promise<void> {
		if (message.length === 0) {
			return;
		}

		const data = JSON.parse(message) as EventData;
		await Promise.all(
			RabbitMQ.e.map(async handler => handler(queue, data))
		);
	}

	protected static async createChannel() {
		if (!RabbitMQ.conn) {
			throw new ApplicationError(
				500,
				'RabbitMQ',
				'Connection is not established'
			);
		}

		const channel = await RabbitMQ.conn.createChannel();
		return channel;
	}
}
