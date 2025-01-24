import { Migration } from '@mikro-orm/migrations';

export class Migration20250124040443 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "product_nostr_event" add column if not exists "medusaVariantId" text not null;');
    this.addSql('alter table if exists "product_nostr_event" drop constraint if exists "product_nostr_event_pkey";');
    this.addSql('alter table if exists "product_nostr_event" add constraint "product_nostr_event_pkey" primary key ("medusaVariantId");');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "product_nostr_event" drop constraint if exists "product_nostr_event_pkey";');
    this.addSql('alter table if exists "product_nostr_event" drop column if exists "medusaVariantId";');
    this.addSql('alter table if exists "product_nostr_event" add constraint "product_nostr_event_pkey" primary key ("medusaProductId");');
  }

}
