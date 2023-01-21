import { FastifyInstance } from 'fastify';
import { IApplyToFastify } from './interfaces';

export interface IApiServer {
	app: FastifyInstance;
	routes: IApplyToFastify;
	plugins: IApplyToFastify;

	bootstrap(): Promise<IHttpServer>;
}

export interface IHttpServer {
	api: IApiServer;
	start(): Promise<boolean>;
	restart(): Promise<boolean>;
	stop(): Promise<boolean>;
	isRunning(): boolean;
}
