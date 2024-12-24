import { useEffect } from "react";
import { useNdk } from "nostr-hooks";

const useNdkConnection = (relayUrls = ["ws://localhost:7777"]) => {
    const { initNdk, ndk } = useNdk();

    useEffect(() => {
        initNdk({
            explicitRelayUrls: relayUrls,
        });
    }, []);

    useEffect(() => {
        if (!ndk) return;

        ndk.connect();
    }, [ndk]);

    return { ndk, relays: relayUrls };
};

export default useNdkConnection;
