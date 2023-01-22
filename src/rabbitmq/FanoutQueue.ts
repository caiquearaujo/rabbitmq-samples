import amqp from 'amqplib';
import BaseQueue, { EventHandler, IQueue } from './BaseQueue';

export default class FanoutQueue extends BaseQueue implements IQueue {
	protected _exchangeName: string;

	constructor(
		name: string,
		events: Array<EventHandler>,
		options: amqp.Options.AssertQueue
	) {
		super(name, events, options);
		this._exchangeName = name;
	}

	public async asConsumer(channel: amqp.Channel) {
		await channel.assertExchange(this._exchangeName, 'fanout', {
			durable: false,
		});

		const queue = await channel.assertQueue('', {
			exclusive: true,
		});

		this._name = queue.queue;
		await channel.bindQueue(this._name, this._exchangeName, '');
	}

	public async asProducer(channel: amqp.Channel) {
		await channel.assertExchange(this._exchangeName, 'fanout', {
			durable: false,
		});
	}

	public send(
		channel: amqp.Channel,
		msg: string,
		options?: amqp.Options.Publish
	) {
		const localOptions = {
			...options,
			persistent: this._options.durable,
		};

		channel.publish(
			this._exchangeName,
			'',
			Buffer.from(msg),
			localOptions
		);
	}
}
