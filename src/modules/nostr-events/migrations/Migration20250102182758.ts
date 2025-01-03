import { Migration } from '@mikro-orm/migrations';

export class Migration20250102182758 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "product-nostr-event" ("id" text not null, "pubkey" text not null, "kind" integer not null, "tags" text[] not null, "content" text not null, "sig" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product-nostr-event_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_product-nostr-event_deleted_at" ON "product-nostr-event" (deleted_at) WHERE deleted_at IS NULL;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "product-nostr-event" cascade;');
  }

}
