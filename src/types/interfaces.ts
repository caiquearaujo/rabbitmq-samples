import { FastifyInstance } from 'fastify';

export interface IApplyToFastify {
	apply(app: FastifyInstance): Promise<void>;
}
