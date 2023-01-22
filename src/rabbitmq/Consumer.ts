import amqp from 'amqplib';
import { EventData, EventHandler } from './BaseQueue';
import { IQueue } from './Queue';
import { IExchange } from './Exchange';

export interface IConsumer {
	listenTo(...routes: Array<IQueue>): IConsumer;
	handlers(events: Array<EventHandler>): IConsumer;
	prepare(channel: amqp.Channel): Promise<void>;
	queue(): IQueue;
	exchange(): IExchange | undefined;
	events(): Array<EventHandler>;
	routes(): Array<IQueue>;
}

export default class Consumer implements IConsumer {
	protected _queue: IQueue;

	protected _exchange?: IExchange;

	protected _routes: Array<IQueue> = [];

	protected _events: Array<EventHandler> = [];

	constructor(queue: IQueue, exchange?: IExchange) {
		this._queue = queue;
		this._exchange = exchange;
	}

	public listenTo(...routes: Array<IQueue>) {
		this._routes = routes;
		return this;
	}

	public handlers(events: Array<EventHandler>) {
		this._events = events;
		return this;
	}

	public async prepare(channel: amqp.Channel) {
		if (this._exchange) {
			await channel.assertExchange(
				this._exchange.name(),
				this._exchange.type(),
				this._exchange.options()
			);
		}

		const queue = await channel.assertQueue(
			this._queue.name(),
			this._queue.options()
		);

		this._queue.applyName(queue.queue);

		if (this._exchange) {
			const excName = this._exchange.name();
			if (this._routes.length > 0) {
				await Promise.all(
					this._routes.map(async route =>
						channel.bindQueue(
							this._queue.name(),
							excName,
							route.name()
						)
					)
				);
			} else {
				await channel.bindQueue(this._queue.name(), excName, '');
			}
		}

		channel.consume(
			this._queue.name(),
			msg => {
				if (msg) {
					Consumer.handle(
						this._queue.name(),
						msg.content.toString(),
						this._events
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

	public queue() {
		return this._queue;
	}

	public exchange() {
		return this._exchange;
	}

	public events() {
		return this._events;
	}

	public routes() {
		return this._routes;
	}

	protected static async handle(
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
}
