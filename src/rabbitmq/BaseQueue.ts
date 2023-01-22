import amqp from 'amqplib';

export interface EventData {
	event: string;
	payload: Record<string, any>;
}

export type EventHandler = (
	queue: string,
	data: EventData
) => Promise<boolean>;

export interface IQueue {
	name(): string;
	events(): Array<EventHandler>;
	options(): amqp.Options.AssertQueue;
	asConsumer(channel: amqp.Channel): Promise<void>;
	asProducer(channel: amqp.Channel): Promise<void>;
	send(
		channel: amqp.Channel,
		msg: string,
		options?: amqp.Options.Publish
	): void;
}

export default class BaseQueue {
	protected _name: string;

	protected _options: amqp.Options.AssertQueue;

	protected _e: Array<EventHandler> = [];

	constructor(
		name: string,
		events: Array<EventHandler>,
		options: amqp.Options.AssertQueue
	) {
		this._name = name;
		this._options = options;
		this._e = events;
	}

	public name() {
		return this._name;
	}

	public options() {
		return this._options;
	}

	public events() {
		return this._e;
	}
}
