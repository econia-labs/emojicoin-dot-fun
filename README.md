<!-- markdownlint-disable MD041 -->

[![pre-commit shield]][pre-commit repo]

<!-- markdownlint-enable MD041 -->

# emojicoin dot fun

<!-- markdownlint-disable MD036 -->

*Sponsored by a grant from the Aptos Foundation*

<!-- markdownlint-enable MD036 -->

## Setting up the environment variables for various release stages

To set up a simple release cycle for the code in this repository, you can
target the `production` branch as the main deployment branch and use
all other branches as preview/development builds.

You can set in Vercel project settings the production branch. By default, this
is `main`, however you can use the `production` branch to separate staging
environments from the release (aka production) environment.

Once you change the production branch setting in Vercel to the `production`
branch on the repo, you should also set the environment variables for the
`production` *environment*, to correspond to the current deployment on the
`production` branch.

To view the current environment variables for a Vercel project, you can easily
do so with the following steps detailed below.

The following instructions utilize the [Vercel CLI] to streamline the process of
checking environment variables so you don't have to do it manually on Vercel,
but you can also do all of this through Vercel on their web application.

Install the `vercel-cli` tool. You can install it with `npm` or `brew`.

```shell
# Install with brew.
brew install vercel-cli

# Install globally with pnpm.
pnpm i -g vercel@latest
```

Login to Vercel through the cli with GitHub OAuth authentication:

```shell
vercel login --github
```

Pull the currently set Vercel environment variables for various environments
and branches:

```shell
vercel env pull --environment=production

vercel env pull --environment=preview

vercel env pull --environment=development
```

To update any of these values, you can use `vercel env add ...`, or you can
save the output of `vercel env pull --environment=...` and upload that to
Vercel with the `Import .env` option.

See the image below for an example of what this process looks like for adding
the following environment variables to the `Preview` and `Deployment`
environments.

```shell
# If you wanted to change a couple values, you'd create an .env file,
# then upload that to Vercel.
# For example, if your file consisted of the following two lines, when you
# upload the file with "Import .env", it will look like the image below.
NEXT_PUBLIC_APTOS_NETWORK="testnet"
NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS="100"
```

![Uploading environment variables with Vercel's UI]

**Note the `Environments` checkboxes. You *must* specify which `Environments`
to apply the environment variables to. In most cases you should alter
`Production` environment variables manually.**

Once you make any changes, either with the CLI or through Vercel's UI, you must
pull the environment variables again to see the new, updated values in your
local repository's settings.

See the [Vercel CLI] docs for more information.

## Cloning this repository's submodules

This repository uses a closed-source implementation of the TradingView charting
library for the production website.

If you don't have access to TradingView's `charting_library` repository, please
run the command below to clone the appropriate submodules:

```shell
git submodule update --init --recursive src/inbox
```

If you do have access to the `charting_library` repository:

```shell
git submodule update --init --recursive
```

[pre-commit repo]: https://github.com/pre-commit/pre-commit
[pre-commit shield]: https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit
[uploading environment variables with vercel's ui]: https://github.com/user-attachments/assets/d613725d-82ed-4a4e-a467-a89b2cf57d91
[vercel cli]: https://vercel.com/docs/cli
