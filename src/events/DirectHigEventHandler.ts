import { EventHandler } from '@/rabbitmq/BaseQueue';

const callback: EventHandler = async queue => {
	console.log(
		'[<-] %s is from direct exchange to critical and error',
		queue
	);
	return true;
};

export default callback;
