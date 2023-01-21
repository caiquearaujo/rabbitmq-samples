import helmetPlugin from './helmet.plugin';
import corsPlugin from './cors.plugin';
import rateLimitPlugin from './ratelimit.plugin';
import compressPlugin from './compress.plugin';

export default [
	helmetPlugin,
	corsPlugin,
	rateLimitPlugin,
	compressPlugin,
];
