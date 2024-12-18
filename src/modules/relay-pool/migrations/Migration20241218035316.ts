import { Migration } from '@mikro-orm/migrations';

export class Migration20241218035316 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "relay" ("id" text not null, "url" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "relay_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_relay_deleted_at" ON "relay" (deleted_at) WHERE deleted_at IS NULL;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "relay" cascade;');
  }

}
