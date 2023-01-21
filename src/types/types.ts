import { FastifyInstance } from 'fastify';

export type TFnApplyToFastify = (app: FastifyInstance) => Promise<void>;
