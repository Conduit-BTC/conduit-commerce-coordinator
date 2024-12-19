import { EventEmitter } from 'events'
import {
    Logger,
} from "@medusajs/framework/types"

export class NostrEventQueue extends EventEmitter {
    private queue: any[] = []
    private processing: boolean = false

    constructor(private readonly logger: Logger) {
        super()
    }

    push(event: any): void {
        this.queue.push(event)
        this.logger.info("Event added to queue: " + JSON.stringify(event))
        this.emit('itemAdded')
        this.processQueue()
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) return

        this.processing = true

        try {
            while (this.queue.length > 0) {
                const event = this.queue[0]

                try {
                    await this.processEvent(event)
                    this.queue.shift()
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

    private async processEvent(event: any): Promise<void> {
        this.emit('processEvent', event)
    }
}
