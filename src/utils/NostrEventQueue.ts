import { EventEmitter } from 'events'
import {
    Logger,
} from "@medusajs/framework/types"

export interface QueueEvent {
    id: string;
    data: any;
}

export class NostrEventQueue extends EventEmitter {
    private queue: any[] = []
    private inFlightEvents: Map<string, QueueEvent> = new Map();
    private processing: boolean = false

    // TODO: Implement delay between events, a max retry mechanism, and a "failed" queue for events that failed to process

    constructor(private readonly logger: Logger) {
        super()
    }

    push(event: any): void {
        const queueEvent: QueueEvent = {
            id: crypto.randomUUID(),
            data: event,
        }
        this.queue.push(queueEvent)
        this.processQueue()
    }


    private processQueue(): void {
        if (this.processing || this.queue.length === 0) return
        this.processing = true
        try {
            while (this.queue.length > 0) {
                const event = this.queue[0]
                try {
                    this.inFlightEvents.set(event.id, event)
                    this.queue.shift()
                    this.emit('processEvent', event)
                } catch (error) {
                    this.logger.error(`Error processing event: ${error}`)
                    break
                }
            }
        } finally {
            this.processing = false
        }
        if (this.queue.length > 0) {
            this.processQueue()
        }
    }

    public confirmProcessed(eventId: string): void {
        if (!this.inFlightEvents.delete(eventId)) {
            this.logger.warn(`Attempted to confirm event ${eventId} but it was not found in in-flight events`)
        }
    }

    public requeueEvent(eventId: string): void {
        const event = this.inFlightEvents.get(eventId)
        if (event) {
            this.queue.push(event)
            this.inFlightEvents.delete(eventId)
            this.logger.info(`Event ${eventId} requeued`)
            this.processQueue()
        } else {
            this.logger.warn(`Attempted to requeue event ${eventId} but it was not found in in-flight events`)
        }
    }

}
