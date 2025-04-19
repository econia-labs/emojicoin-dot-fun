# Improved processor PoC

This processor is an example processor for an Aptos package.

It has many improvements over typical processors, including faster backfilling, cleaner design, and easier testability.

## TL;DR

- Cleaner
- Simpler
- More testable
- Less error prone
- Easier to read and review
- Faster backfilling
- More performant
- Less DevOps overhead

## Cleanness

It has been demonstrated multiple times that forking the Aptos indexers repo
leads to complex, hard to write and hard to review code. Furthermore, it adds
thousands of lines of code, that are irrelevant to the project, that
complexifies developer experience, and slows down *considerably* the IDE.

To fix this issue, we use a new approach that consists of extracting the GRPC
functionality from the original Aptos indexers repo, and packaging it in a
simple to use way.

When it comes to processing events, rather than putting all the processing
logic in one giant loop, we create pipelines, that take as an input
transactions, and produce processed data as an output.

## Backfilling

Backfilling is always a big pain when backfilling a package deployed a long
time ago. In order to reduce the time it takes to backfill, we implemented a
parallel GRPC connection mechanism, which allows multiple GRPC clients to
connect at the same time during the backfilling process, in order to speed up
the latter. In local testing, this has shown an ~83% decrease in backfilling
time, and even better results can be achieved with a data center grade internet
connection.

To further improve the backfilling process, raw events are always saved in the
database. This introduces a new type of upgrade. We are familiar with a cold
upgrade, which is an upgrade that requires a database drop and full
backfilling, and a hot upgrade, that only requires migrations to be run. This
processor introduces lukewarm upgrades: an upgrade that only needs to reprocess
events, but doesn't need to refetch events from the GRPC stream. As processing
events takes up considerably less time than getting them from the GRPC stream,
this kind of upgrade will be very useful as a middle ground between a cold and
a hot upgrade. Cold upgrades will only be required when adding a new package to
the list of packaged to index.

## Testability

As we have seen before, testing is a necessary step in building a reliable
processor. Unfortunately, this aspect has been overlooked when writing the
processor code. This has led to the processing logic being almost impossible to
unit test, and we exclusively relied on E2E tests, which do not have the same
coverage and reliability as unit tests.

This processor makes use of simple and concise pipelines, to split the logic
into atomic elements, that make the testing of processing logic 100% (or at
least, *way more* than before) unit testable. This will help ensure that bugs
are caught at writing time, rather than during runtime.

## Readability and reviewability

For the same reasons as above, the readability and reviewability of the
processing logic has been highly impacted by what we can only refer to as
*spaghetti code*. Pipelines will lead to better logic separation, and much
better r&r. In accordance with unit tests, this should greatly improve the
quality of code committed into the main branches.

## Performance

Last but not least, the performance aspect of the processor is also improved
upon. Due to the simpler and cleaner architecture of this processor,
performance tuning was made considerably easier. Pipelines store an internal
state that can be committed at any time. You could commit the state after each
transaction processed, or you could wait to process 10000 transactions before
committing the state to the database. Currently, the state is committed at the
end of each batch of transactions received from the GRPC node, but this can be
tuned to happen more or less often, depending on the observed needs. This can
result in reduced writes, as all the data is merged in memory before being
committed to the database, and faster data availability, from the moment it is
emitted on chain to the moment it is available in the database.

## Minor improvements

Having our own processor also has a couple of other benefits.

First of all, we can now have our own logging system, that better suits our
needs. The Aptos Labs built logging system wasn't bad, but it contained many
information that we did not care about, and lacked some that we did care about.
This made it difficult to read logs, and sometimes impossible to diagnose an
issue by only looking at the logs.

We can also avoid a couple of configurations issues we encountered before, as
we do not need a configuration file anymore. The processor can now be
configured with CLI arguments (more suited for local testing) or environment
variables (more suited for a cloud deployment).

Last, we can now incorporate this into our own monorepo, and do not need to
rely on a git submodule, which created a lot of maintenance and DevOps
overhead.
