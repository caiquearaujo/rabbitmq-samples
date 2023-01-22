import amqp from 'amqplib';

export interface IExchange {
	name(): string;
	type(): string;
	options(): amqp.Options.AssertExchange | undefined;
}

export default class Exchange implements IExchange {
	protected _name: string;

	protected _type: string;

	protected _options?: amqp.Options.AssertExchange;

	constructor(
		name: string,
		type: string,
		options?: amqp.Options.AssertExchange
	) {
		this._name = name;
		this._type = type;
		this._options = options;
	}

	public name() {
		return this._name;
	}

	public type() {
		return this._type;
	}

	public options() {
		return this._options;
	}
}
