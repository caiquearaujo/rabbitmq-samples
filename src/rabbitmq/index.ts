import amqp from 'amqplib';
import ApplicationError from '@/exceptions/ApplicationError';

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

	protected static consumer?: amqp.Channel;

	protected static e: Array<EventHandler> = [];

	public static async connect(host: string): Promise<void> {
		if (RabbitMQ.conn) {
			return;
		}

		try {
			RabbitMQ.conn = await amqp.connect(host);
			RabbitMQ.consumer = await RabbitMQ.conn.createChannel();
		} catch (error) {
			console.log(error);
			throw new ApplicationError(
				500,
				'RabbitMQ',
				'Failed to start a connection'
			);
		}
	}

	public static async queue(
		queue: string,
		options: amqp.Options.AssertQueue
	): Promise<void> {
		if (!RabbitMQ.consumer) {
			throw new ApplicationError(
				500,
				'RabbitMQ',
				`Consumer channel is not created`
			);
		}

		try {
			await RabbitMQ.consumer.assertQueue(queue, options);
		} catch (error) {
			console.log(error);
			throw new ApplicationError(
				500,
				'RabbitMQ',
				`Queue ${queue} is not created to consumer channel`
			);
		}
	}

	public static async consume(
		queue: string,
		onMessage: (msg: amqp.Message | null) => void
	): Promise<void> {
		if (!RabbitMQ.consumer) {
			throw new ApplicationError(
				500,
				'RabbitMQ',
				`Consumer channel is not created`
			);
		}

		try {
			await RabbitMQ.consumer.consume(queue, onMessage);
		} catch (error) {
			console.log(error);
			throw new ApplicationError(
				500,
				'RabbitMQ',
				`Cannot consume queue ${queue} from consumer channel`
			);
		}
	}

	public static async produce(
		queue: string,
		message: EventData
	): Promise<void> {
		if (!RabbitMQ.conn) {
			throw new ApplicationError(
				500,
				'RabbitMQ',
				'Connection is not established'
			);
		}

		try {
			const channel = await RabbitMQ.conn.createChannel();
			channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));

			console.log(`[->] New message sent to queue ${queue}`);
			console.log(message);

			await channel.close();
		} catch (error) {
			console.log(error);
			throw new ApplicationError(
				500,
				'RabbitMQ',
				`Cannot produce on queue ${queue}`
			);
		}
	}

	public static ack(msg: amqp.Message | null): void {
		if (!RabbitMQ.consumer) {
			throw new ApplicationError(
				500,
				'RabbitMQ',
				`Consumer channel is not created`
			);
		}

		if (msg) {
			RabbitMQ.consumer.ack(msg);
		}
	}

	public static async closeConsumer(): Promise<void> {
		if (RabbitMQ.consumer) {
			await RabbitMQ.consumer.close();
		}
	}

	public static async close(): Promise<void> {
		if (RabbitMQ.conn) {
			await RabbitMQ.conn.close();
		}

		await RabbitMQ.closeConsumer();
	}

	public static event(e: EventHandler) {
		RabbitMQ.e.push(e);
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
}
