import { EventHandler } from '@/rabbitmq/BaseQueue';

const callback: EventHandler = async queue => {
	console.log('[<-] %s is from fanout exchange', queue);
	return true;
};

export default callback;
