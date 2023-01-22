import { EventHandler } from '@/rabbitmq/BaseQueue';

const callback: EventHandler = async (queue, data) => {
	console.log('[<-] New message received from queue %s', queue);
	console.log(data);
	return true;
};

export default callback;
