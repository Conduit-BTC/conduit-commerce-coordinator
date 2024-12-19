# C3 - Conduit Commerce Coordinator

### The first Nostr Commerce Coorinator (NCC) - Built with MedusaJS

#### THIS IS A WORK IN PROGRESS > Subscribe to our newsletter for updates about Conduit BTC, the C3 system, our in-development Nostr E-Commerce client, and more - [The Conduit Signal](https://buttondown.com/Conduit)

#### Learn more about NCCs by reading their debut article: **[Nostr E-Commerce - Benefits, Shortcomings, and The Case for Coordinators](https://yakihonne.com/article/naddr1qq257drwx94rzs2lwyey7a33v43nqjj4w4j85q3qnkfqwlz7xkhhdaa3ekz88qqqk7a0ks7jpv9zdsv0u206swxjw9rqxpqqqp65wp3t053)**

### What is an NCC?

An NCC (_Nostr Commerce Coordinator_) is a server-based Nostr bot that:

- Is under control of, and represents, the Merchant on Nostr
- Subscribes to a relay pool
- Posts and queries NIP-15 events
- Coordinates the NIP-15 Checkout process on behalf of a Merchant
  - Inventory Management: verify, increment, and decrement product stock, create
    and update Stalls and Products on relays via signed events
  - Payment Processing: generate Lightning invoices, send invoice to customer,
    respond to payment events via webhook
  - Fulfillment Services: create shipments, notify fulfillment partners
- Handle Checkout-related communications with the Customer
- Notify Merchant when certain things occur
- Collect sales-relates metrics for Merchant visibility

To summarize the benefits of an NCC:

- Automated, frictionless checkout flow
- Direct integration with Merchant's existing e-commerce stack: inventory
  management, payment processing, and shipping service
- Separation of Checkout-related direct messages (containing ugly JSON) from
  actual human readable direct messages,
- General separation-of-concerns between Merchant's social graph and e-commerce
  activities
- Ability to implement additional commerce features, such as metrics collection,
  financial statements, subscriptions, and much more yet-to-be explored
  possibilities

### Why Medusa?

We have chosen MedusaJS as the backbone of the world's first NCC.

The MedusaJS framework absolutely shines for e-commerce, the developer
experience is unparalleled, the architecture is well-developed, the
documentation is as-perfect as it gets. The defaults are sensible. We get,
out-of-the-box, a complete e-commerce stack: Stores, Products, Orders,
integrations with external services, and powerful extensibility.

Conduit's primary task-at-hand is to transform MedusaJS into a Nostr Commerce
Coordinator. Currently, this implementation is a work-in-progress.

We're using [Nostrify](https://nostrify.dev/) and [nostr-tools](https://github.com/nbd-wtf/nostr-tools?tab=readme-ov-file) to handle the Nostr/Medusa dance.
There's a _lot_ more to come, so check back often, oh Argonaut of the
Nostrverse!

<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  Building blocks for digital commerce
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/master/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

## Compatibility

This starter is compatible with versions >= 1.8.0 of `@medusajs/medusa`.

## Getting Started

Visit the [Quickstart Guide](https://docs.medusajs.com/learn) to set up a
server.

Visit the [Docs](https://docs.medusajs.com/learn#get-started) to learn more
about our system requirements.

## What is Medusa

Medusa is a set of commerce modules and tools that allow you to build rich,
reliable, and performant commerce applications without reinventing core commerce
logic. The modules can be customized and used to build advanced ecommerce
stores, marketplaces, or any product that needs foundational commerce
primitives. All modules are open-source and freely available on npm.

Learn more about
[Medusa’s architecture](https://docs.medusajs.com/learn/advanced-development/architecture/overview)
and [commerce modules](https://docs.medusajs.com/learn/basics/commerce-modules)
in the Docs.

## Roadmap, Upgrades & Plugins

You can view the planned, started and completed features in the
[Roadmap discussion](https://github.com/medusajs/medusa/discussions/categories/roadmap).

Follow the [Upgrade Guides](https://docs.medusajs.com/upgrade-guides/) to keep
your Medusa project up-to-date.

Check out all [available Medusa plugins](https://medusajs.com/plugins/).

## Community & Contributions

The community and core team are available in
[GitHub Discussions](https://github.com/medusajs/medusa/discussions), where you
can ask for support, discuss roadmap, and share ideas.

Join our [Discord server](https://discord.com/invite/medusajs) to meet other
community members.

## Other channels

- [GitHub Issues](https://github.com/medusajs/medusa/issues)
- [Twitter](https://twitter.com/medusajs)
- [LinkedIn](https://www.linkedin.com/company/medusajs)
- [Medusa Blog](https://medusajs.com/blog/)
