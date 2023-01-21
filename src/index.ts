/* eslint-disable import/first */
import moduleAlias from 'module-alias';
import path from 'path';

const src = path.resolve(__dirname, '..', 'src');
const build = path.resolve(__dirname, '..', 'build');

if (process.env.NODE_ENV === 'production') {
	moduleAlias.addAliases({
		'@': build,
	});
} else {
	moduleAlias.addAliases({
		'@': src,
	});
}

import routes from '@/routes';
import plugins from '@/server/plugins';
import FastifyApplierGroup from '@/server/FastifyApplierGroup';
import ApiServer from './server/ApiServer';

const options = {
	routes: new FastifyApplierGroup(...routes),
	plugins: new FastifyApplierGroup(...plugins),
};

new ApiServer(options)
	.bootstrap()
	.then(server => {
		server
			.start()
			.then(() => console.log(`⚡️ Server is ready and running.`))
			.catch(err => {
				console.error('❌ Server has failed while starting');
				console.error(err);
				process.exit(1);
			});

		process.on('SIGINT', async () => {
			await server.stop();
			process.exit(0);
		});

		process.on('SIGTERM', async () => {
			await server.stop();
			process.exit(0);
		});
	})
	.catch(err => {
		console.error('❌ Server has failed while starting');
		console.error(err);
		process.exit(1);
	});
