import amqp from 'amqplib';
import { IQueue } from './Queue';
import { IExchange } from './Exchange';

export interface IProducer {
	publish(
		channel: amqp.Channel,
		msg: string,
		options?: amqp.Options.Publish
	): Promise<void>;
}

export default class Producer {
	protected _exchange?: IExchange;

	protected _queue: IQueue;

	constructor(queue: IQueue, exchange?: IExchange) {
		this._exchange = exchange;
		this._queue = queue;
	}

	public async publish(
		channel: amqp.Channel,
		msg: string,
		options?: amqp.Options.Publish
	) {
		if (this._exchange) {
			await channel.assertExchange(
				this._exchange.name(),
				this._exchange.type(),
				this._exchange.options()
			);
		}

		channel.publish(
			this._exchange?.name() || '',
			this._queue.name(),
			Buffer.from(msg),
			options
		);
	}
}
