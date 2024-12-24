import { useEffect, useState } from "react";
import { useSubscription } from "nostr-hooks";
import type NDK from "@nostr-dev-kit/ndk";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button, Container, Heading } from "@medusajs/ui";
import useNdkConnection from "../../hooks/useNdkConnection";
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types";

const SyncWidget = ({
    data,
}: DetailWidgetProps<AdminProduct>) => {
    console.log("Product: ", data);

    // const { ndk } = useNdkConnection();
    // const [onRelay, setOnRelay] = useState(false);
    // const [connected, setConnected] = useState(false);

    // const subId = "all-events";
    // const { events, isLoading, createSubscription } = useSubscription(subId);

    // useEffect(() => {
    //     const filters = {
    //         filters: [{
    //             kinds: [30018],
    //             limit: 50,
    //         }],
    //     };

    //     createSubscription(filters);
    // }, []);

    // useEffect(() => {
    //     if (!events) return;
    //     setOnRelay(isProductOnRelay(events, data));
    // }, [events]);

    // useEffect(() => {
    //     if (ndk) setConnected(true);
    // }, [ndk]);

    // if (isLoading) return <LoadingState />;

    // if (!connected) return <ErrorState error="Connection issue..." />;

    return (
        <Container className="divide-y p-0">
            <div className="px-6 py-4">
                <Heading level="h1">Relay Sync Status</Heading>
                {/* <RelayStatus onRelay={onRelay} product={data} ndk={ndk} /> */}
            </div>
        </Container>
    );
};

const LoadingState = () => {
    return (
        <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
                <Heading level="h2">Relay Sync Status</Heading>
                <h3 className="animate-pulse text-yellow-500">Loading...</h3>
            </div>
        </Container>
    );
};

const ErrorState = ({ error }: { error: string }) => {
    return (
        <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
                <Heading level="h2">Relay Sync Status</Heading>
                <h3 className="animate-pulse text-yellow-500">{error}</h3>
            </div>
        </Container>
    );
};

const isProductOnRelay = (events: any[], product: AdminProduct) => {
    console.log(events);
    return events.some((event) => {
        return event.content.contains(product.id);
    });
};

const RelayStatus = (
    { onRelay, product, ndk }: {
        onRelay: boolean;
        product: AdminProduct;
        ndk: NDK;
    },
) => {
    return (
        <div>
            <span className={`text-${onRelay ? "green" : "red"}-500`}>
                {onRelay ? "On Relay" : "Not on Relay"}
            </span>
            <div className="text-xs text-gray-500">
                {onRelay
                    ? "This product is on the relay"
                    : "This product is not on the relay"}
            </div>
            {onRelay
                ? (
                    <Button className="mt-4 bg-red-500">
                        Remove from Relay
                    </Button>
                )
                : (
                    <Button
                        className="mt-4"
                        onClick={() => console.log(product, ndk)}
                    >
                        Sync
                    </Button>
                )}
        </div>
    );
};

export const config = defineWidgetConfig({
    zone: "product.details.before",
});

export default SyncWidget;
