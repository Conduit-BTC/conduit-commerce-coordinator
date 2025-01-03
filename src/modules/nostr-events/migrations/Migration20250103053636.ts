import { Migration } from '@mikro-orm/migrations';

export class Migration20250103053636 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "product-nostr-event" add column if not exists "medusaProductId" text not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "product-nostr-event" drop column if exists "medusaProductId";');
  }

}
