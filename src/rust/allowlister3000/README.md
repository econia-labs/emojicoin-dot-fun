# AllowLister3K

AllowLister3K is a simple web server that will respond with either `true` or
`false`, depending on wether the provided 32-byte address is present in its
allow list or not.

## Running

To run the AllowLister3K, you first need to set the `ALLOWLIST_FILE`
environment variable to the path of the file containing the allowlist. You can
then start the program by running `cargo run --release`.

To update the allowlist, add the desired address(es) to the allowlist file.
Then, **restart the program**.

## Allowlist format

The allowlist file format is just a plain text file with one address per line.

## Address format

Addresses must start with `0x`, and can have any amount of leading zeros.
AllowLister3K does not check for invalid hex strings. AllowLister3K checks that
incoming addresses over the network aren't bigger than 66 characters (`0x` +
64). This check is not performed on the allowlist file.

## HTTP requests

To make a request to AllowLister3K, simply make a GET request to `/address`
where `address` is the address in the correct format you want to check.

## Deploying

### GCP

The easiest way to deploy the AllowLister3K on GCP is by hosting it on a
Compute Engine virtual machine.

#### Step 1

Create a VM on GCP by following [the official documentation][gcp-vm-docs].

#### Step 2

Compile the AllowLister3K by running `cargo build --release`. Note that if you
are not on an x86, you might need to specifically tell the Rust compiler to
compile for x86 (add `--target x86_64-unknown-linux-gnu` to the command, and
make sure the `x86_64-unknown-linux-gnu` target is install by running
`rustup target list` then optionally
`rustup target install x86_64-unknown-linux-gnu`).

Note that if you compiled with `--target x86_64-unknown-linux-gnu`, the binary
will be saved at `target/x86_64-unknown-linux-gnu/release/allowlister3000`
instead of `target/release/allowlister3000`.

#### Step 3

Get the binary on the GCP instance. You can do this by first reading [the GCP
documentation](https://cloud.google.com/compute/docs/instances/ssh) about how
to connect to a VM using SSH. Once you are able to connect to your VM via SSH,
simply run `scp ./target/release/allowlister3000 user@vm:~/` where `user@vm` is
replaced by the correct user and domain/IP to connect to the VM.

Note that you can alternately clone the code base on the GCP instance and
directly compile on there, but you will need to install the Rust toolchain on
the VM.

#### Step 4

Create an allowlist file on the VM.

Once all the addresses are added to the file, set `ALLOWLIST_FILE` to the path
of the file.

#### Step 5

Start the AllowLister3K by running `./path_to_binary`.

#### TL;DR

You can just run these commands and everything should work.

```bash
gcloud compute instances create allowlister3000 \
    --image-project=ubuntu-os-cloud \
    --image-family=ubuntu-minimal-2204-lts \
    --machine-type=e2-micro
gcloud compute firewall-rules create allow3k --allow tcp:3000
cargo build --release --target x86_64-unknown-linux-gnu
gcloud compute scp \
    ./target/x86_64-unknown-linux-gnu/release/allowlister3000 \
    root@allowlister3000:/
gcloud compute ssh root@allowlister3000
echo "0x..." >> allowlist.txt
nohup bash -c 'ALLOWLIST_FILE=./allowlist.txt /allowlister3000 &!'
```

#### Verifying

Run `curl IP:3000/0x...` to check that the AllowLister3K is working properly.
To get `IP`, you can run `gcloud compute instances list`.

[gcp-vm-docs]: https://cloud.google.com/compute/docs/instances/create-start-instance
