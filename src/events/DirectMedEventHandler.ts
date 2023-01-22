import { EventHandler } from '@/rabbitmq/BaseQueue';

const callback: EventHandler = async queue => {
	console.log('[<-] %s is from direct exchange to info and warn', queue);
	return true;
};

export default callback;
