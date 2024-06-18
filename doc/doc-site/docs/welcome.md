---
slug: /
title: 🍆 Welcome 🍆
hide_title: true
description: Documentation for emojicoin dot fun
---

![Check out this alt text](/img/banner.svg)

This is text. Hello `kristina-in-monospace`!

## Emojis in a header 🍆🍆🍆

In a paragraph: 🍆🍆🍆🍆🍆🍆🍆🍆🍆🍆🍆🍆🍆🍆🍆

## Equations

Inline mode: $x = \frac{a}{b}$

Display mode:

$$x = \frac{a}{b}$$

## Mermaid diagram

```mermaid
flowchart TB

subgraph gcp[Google Cloud Platform]
    subgraph load-balancer[Global Load Balancer]
        subgraph armor[GCP Cloud Armor]
        direction LR
            rate-limiting[IP Rate Limiting]
            ddos[Layer 7 DDoS Protection]
        end
    end
    load-balancer-->rest-service
    subgraph rest-service[REST API Cloud Run Service]
        subgraph r-instance-1[PostgREST Instance]
            ri1c[Container]
        end
        subgraph r-instance-2[PostgREST Instance]
            ri2c[Container]
        end
    end
    rest-service --> rest-connector
    subgraph vpc[PostgreSQL VPC]
        aggregator-container-->|Private IP|cloud-pg
        processor-container-->|Private IP|cloud-pg
        subgraph processor-image[Processor VM]
            processor-container[Container]
        end
        subgraph aggregator-image[Aggregator VM]
            aggregator-container[Container]
        end
        processor-container-->processor_disk[Config disk]
        cloud-pg[(PostgreSQL via Cloud SQL)]
        rest-connector(REST VPC connector)--->cloud-pg
    end
end
processor-container-->grpc[Aptos Labs gRPC]
pg_admin[PostgreSQL Admin]-->|Public IP|cloud-pg
leaderboard[Vercel Leaderboard]-->load-balancer

classDef blue fill:#134d52
classDef green fill:#13521d
classDef yellow fill:#979e37
classDef purple fill:#800080
class load-balancer purple;
class gcp blue;
class vpc green;
class ws-service yellow;
class rest-service yellow;
```

## Header

This sentence uses reference links: [independent audits].

## A table

| A column | Account address |
| -------- | --------------- |
| Hi       | `hey`           |
| There    | `you`           |

:::tip

This is a tip admonition.

:::

:::note

This is a note admonition.

:::

:::caution

This is a caution admonition.

:::

Check out this monospace code block:

> ```text
>                                    1001 [35 -> 38]
>                                   /    \
>               [50 -> 60 -> 55] 1000    1003 [20]
> AVL queue head ^                      /    \
>                          [15 -> 5] 1002    1004 [4 -> 10]
>                                                       ^ AVL queue tail
> ```

Check out this fenced code block:

```toml
[dependencies.Econia]
git = "https://github.com/econia-labs/econia"
subdir = "src/move/econia"
rev = "mainnet"
```

## External resources

This is a list where each item is a reference link:

- [Discord]
- [GitHub]
- [Medium]
- [Twitter]

[discord]: https://discord.gg/econia
[github]: https://github.com/econia-labs/econia
[independent audits]: security
[medium]: https://medium.com/econialabs
[twitter]: https://twitter.com/econialabs
