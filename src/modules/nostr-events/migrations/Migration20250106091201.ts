import { Migration } from '@mikro-orm/migrations';

export class Migration20250106091201 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "order-nostr-event" ("id" text not null, "pubkey" text not null, "kind" integer not null, "tags" text[] not null, "content" text not null, "sig" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order-nostr-event_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_order-nostr-event_deleted_at" ON "order-nostr-event" (deleted_at) WHERE deleted_at IS NULL;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "order-nostr-event" cascade;');
  }

}
