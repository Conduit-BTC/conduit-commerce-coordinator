import { Migration } from '@mikro-orm/migrations';

export class Migration20250103054250 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "product-nostr-event" drop constraint if exists "product-nostr-event_pkey";');
    this.addSql('alter table if exists "product-nostr-event" add constraint "product-nostr-event_pkey" primary key ("medusaProductId");');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "product-nostr-event" drop constraint if exists "product-nostr-event_pkey";');
    this.addSql('alter table if exists "product-nostr-event" add constraint "product-nostr-event_pkey" primary key ("id");');
  }

}
