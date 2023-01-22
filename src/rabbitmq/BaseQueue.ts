export interface EventData {
	event: string;
	payload: Record<string, any>;
}

export type EventHandler = (
	queue: string,
	data: EventData
) => Promise<boolean>;
