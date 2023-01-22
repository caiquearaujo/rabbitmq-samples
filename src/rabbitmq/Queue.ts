import amqp from 'amqplib';
import BaseQueue, { IQueue } from './BaseQueue';

export default class Queue extends BaseQueue implements IQueue {
	public async asConsumer(channel: amqp.Channel) {
		await channel.assertQueue(this._name, this._options);
	}

	public async asProducer(channel: amqp.Channel) {
		await this.asConsumer(channel);
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

		channel.sendToQueue(this._name, Buffer.from(msg), localOptions);
	}
}
