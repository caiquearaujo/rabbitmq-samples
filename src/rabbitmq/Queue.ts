import amqp from 'amqplib';

export interface IQueue {
	name(): string;
	applyName(name: string): IQueue;
	options(): amqp.Options.AssertQueue | undefined;
}

export default class Queue implements IQueue {
	protected _name: string;

	protected _options?: amqp.Options.AssertQueue;

	protected _exclusive = false;

	constructor(name: string, options?: amqp.Options.AssertQueue) {
		this._name = name;
		this._options = options;
	}

	public name() {
		return this._name;
	}

	public applyName(name: string) {
		this._name = name;
		return this;
	}

	public options() {
		return this._options;
	}

	public exclusive() {
		this._exclusive = true;
		this._name = '';
		return this;
	}

	public isExclusive() {
		return this._exclusive;
	}
}
