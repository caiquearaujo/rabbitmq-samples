import amqp from 'amqplib';
import ApplicationError from '@/exceptions/ApplicationError';
import { IConsumer } from './Consumer';
import { IExchange } from './Exchange';
import { EventData } from './BaseQueue';

export default class RabbitMQ {
	protected static _conn?: amqp.Connection;

	protected static _channels: {
		consumer?: amqp.Channel;
		producer?: amqp.Channel;
	} = {};

	protected static _consumers: Array<IConsumer> = [];

	public static async connect(
		host: string,
		messagesAtTime = 1
	): Promise<void> {
		if (RabbitMQ._conn) {
			return;
		}

		try {
			RabbitMQ._conn = await amqp.connect(host);

			RabbitMQ._channels.consumer =
				await RabbitMQ._conn.createChannel();
			RabbitMQ._channels.producer =
				await RabbitMQ._conn.createChannel();

			RabbitMQ._channels.consumer.prefetch(messagesAtTime);
		} catch (error) {
			console.log(error);
			throw new ApplicationError(
				500,
				'RabbitMQ',
				'Failed to start a connection'
			);
		}
	}

	public static consumers(...consumers: Array<IConsumer>) {
		this._consumers = consumers;
		return RabbitMQ;
	}

	public static async subscribe() {
		if (!RabbitMQ._channels.consumer) {
			throw new ApplicationError(
				500,
				'RabbitMQ',
				'Consumer channel is not initialized'
			);
		}

		this._consumers.forEach(consumer => {
			consumer.prepare(RabbitMQ._channels.consumer as amqp.Channel);
		});
	}

	public static async publish(
		queue: string,
		message: EventData,
		options?: amqp.Options.Publish,
		exchange?: IExchange
	): Promise<void> {
		if (!RabbitMQ._channels.producer) {
			throw new ApplicationError(
				500,
				'RabbitMQ',
				'Consumer channel is not initialized'
			);
		}

		const channel = RabbitMQ._channels.producer;

		if (exchange) {
			await channel.assertExchange(
				exchange.name(),
				exchange.type(),
				exchange.options()
			);
		}

		channel.publish(
			exchange?.name() || '',
			queue,
			Buffer.from(JSON.stringify(message)),
			options
		);
	}

	public static async close(): Promise<void> {
		if (RabbitMQ._channels.consumer) {
			await RabbitMQ._channels.consumer.close();
		}

		if (RabbitMQ._channels.producer) {
			await RabbitMQ._channels.producer.close();
		}

		if (RabbitMQ._conn) {
			await RabbitMQ._conn.close();
		}
	}
}
