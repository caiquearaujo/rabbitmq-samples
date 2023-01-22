import { EventHandler } from '@/rabbitmq/BaseQueue';

const callback: EventHandler = async queue => {
	console.log('[<-] %s is from topic exchange to car.*', queue);
	return true;
};

export default callback;
