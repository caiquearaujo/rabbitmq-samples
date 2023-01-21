import amqp from 'amqplib';

export default class Queue {
	protected _name: string;

	protected _options: amqp.Options.AssertQueue;

	constructor(name: string, options: amqp.Options.AssertQueue) {
		this._name = name;
		this._options = options;
	}

	public name() {
		return this._name;
	}

	public options() {
		return this._options;
	}

	public async assert(channel: amqp.Channel) {
		await channel.assertQueue(this._name, this._options);
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
