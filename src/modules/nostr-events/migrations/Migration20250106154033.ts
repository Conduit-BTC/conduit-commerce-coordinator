import { Migration } from '@mikro-orm/migrations';

export class Migration20250106154033 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "order_nostr_event" ("id" text not null, "pubkey" text not null, "kind" integer not null, "tags" text[] not null, "content" text not null, "sig" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_nostr_event_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_order_nostr_event_deleted_at" ON "order_nostr_event" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('create table if not exists "product_nostr_event" ("medusaProductId" text not null, "id" text not null, "pubkey" text not null, "kind" integer not null, "tags" text[] not null, "content" text not null, "sig" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_nostr_event_pkey" primary key ("medusaProductId"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_product_nostr_event_deleted_at" ON "product_nostr_event" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('drop table if exists "order-nostr-event" cascade;');

    this.addSql('drop table if exists "product-nostr-event" cascade;');
  }

  async down(): Promise<void> {
    this.addSql('create table if not exists "order-nostr-event" ("id" text not null, "pubkey" text not null, "kind" integer not null, "tags" text[] not null, "content" text not null, "sig" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order-nostr-event_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_order-nostr-event_deleted_at" ON "order-nostr-event" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('create table if not exists "product-nostr-event" ("medusaProductId" text not null, "id" text not null, "pubkey" text not null, "kind" integer not null, "tags" text[] not null, "content" text not null, "sig" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product-nostr-event_pkey" primary key ("medusaProductId"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_product-nostr-event_deleted_at" ON "product-nostr-event" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('drop table if exists "order_nostr_event" cascade;');

    this.addSql('drop table if exists "product_nostr_event" cascade;');
  }

}
