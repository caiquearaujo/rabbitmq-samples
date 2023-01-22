import amqp from 'amqplib';
import ApplicationError from '@/exceptions/ApplicationError';
import { EventData, EventHandler, IQueue } from './BaseQueue';

export default class RabbitMQ {
	protected static conn?: amqp.Connection;

	protected static channels: {
		consumer?: amqp.Channel;
		producer?: amqp.Channel;
	} = {};

	protected static queues: Record<string, IQueue> = {};

	public static async connect(
		host: string,
		messagesAtTime = 1
	): Promise<void> {
		if (RabbitMQ.conn) {
			return;
		}

		try {
			RabbitMQ.conn = await amqp.connect(host);

			RabbitMQ.channels.consumer = await RabbitMQ.conn.createChannel();
			RabbitMQ.channels.producer = await RabbitMQ.conn.createChannel();

			RabbitMQ.channels.consumer.prefetch(messagesAtTime);
		} catch (error) {
			console.log(error);
			throw new ApplicationError(
				500,
				'RabbitMQ',
				'Failed to start a connection'
			);
		}
	}

	public static register(queue: IQueue) {
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

		if (!RabbitMQ.channels.consumer) {
			throw new ApplicationError(
				500,
				'RabbitMQ',
				'Consumer channel is not initialized'
			);
		}

		const channel = RabbitMQ.channels.consumer;

		await RabbitMQ.queues[queue].asConsumer(channel);
		channel.consume(
			RabbitMQ.queues[queue].name(),
			msg => {
				if (msg) {
					RabbitMQ.handle(
						RabbitMQ.queues[queue].name(),
						msg.content.toString(),
						RabbitMQ.queues[queue].events()
					)
						.then(
							() => {
								channel.ack(msg);
							},
							() => {
								channel.nack(msg);
							}
						)
						.catch(() => {
							channel.nack(msg);
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

		if (!RabbitMQ.channels.producer) {
			throw new ApplicationError(
				500,
				'RabbitMQ',
				'Consumer channel is not initialized'
			);
		}

		await RabbitMQ.queues[queue].asProducer(RabbitMQ.channels.producer);
		RabbitMQ.queues[queue].send(
			RabbitMQ.channels.producer,
			JSON.stringify(message)
		);
	}

	public static async close(): Promise<void> {
		if (RabbitMQ.channels.consumer) {
			await RabbitMQ.channels.consumer.close();
		}

		if (RabbitMQ.channels.producer) {
			await RabbitMQ.channels.producer.close();
		}

		if (RabbitMQ.conn) {
			await RabbitMQ.conn.close();
		}
	}

	public static async handle(
		queue: string,
		message: string,
		events: Array<EventHandler>
	): Promise<void> {
		if (message.length === 0) {
			return;
		}

		const data = JSON.parse(message) as EventData;
		await Promise.all(events.map(async handler => handler(queue, data)));
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
