export type NostrEvent = {
    id: string;
    pubkey: string;
    created_at: number | undefined;
    kind: number | undefined;
    content: string;
    tags: NDKTag[] | string[][];
    sig: string | undefined;
}
