import { useEffect } from "react";
import { useNdk } from "nostr-hooks";
import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";

const useNdkConnection = (relayUrls = ["ws://localhost:7777"]) => {
    const { initNdk, ndk } = useNdk();

    const signer = new NDKPrivateKeySigner(process.env.PRIVKEY);

    useEffect(() => {
        initNdk({
            explicitRelayUrls: relayUrls,
            signer,
        });
    }, []);

    useEffect(() => {
        if (!ndk) return;

        ndk.connect();
    }, [ndk]);

    return { ndk, relays: relayUrls };
};

export default useNdkConnection;
