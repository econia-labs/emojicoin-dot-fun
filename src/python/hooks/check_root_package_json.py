#!/usr/bin/env python3
# cspell:words colorama
# cspell:words lightblack
import json
import os
import sys
from pathlib import Path

from colorama import Fore, init

import utils


def main(fix_version=False):
    init(autoreset=True)
    root = utils.get_git_root()
    relative_root = utils.get_git_root_relative()

    # Get the root directory's package.json as json data.
    root_package_json_path = os.path.join(root, "package.json")
    root_package_json = json.load(open(root_package_json_path, "r"))
    root_pnpm_version = root_package_json["packageManager"]

    # Get the frontend directory's package.json as json data.
    rel_frontend_path = "src/typescript/frontend/package.json"
    frontend_package_json_path = Path(os.path.join(root, rel_frontend_path)).resolve()
    frontend_package_json = json.load(open(frontend_package_json_path, "r"))
    frontend_pnpm_version = frontend_package_json["packageManager"]

    pm_str = f"{Fore.LIGHTBLUE_EX}packageManager{Fore.RESET}"

    # Ensure the `package.json` file isn't being used for any other fields.
    if len(root_package_json) != 1:
        print(
            f"{Fore.RED} {root_package_json_path} ",
            f"should contain a single field: {pm_str}.",
        )
        sys.exit(1)

    rp_json_path = str(root_package_json_path)
    fp_json_path = str(frontend_package_json_path)
    formatted_root = Fore.LIGHTBLACK_EX + rp_json_path.lstrip(relative_root)
    formatted_frontend = Fore.LIGHTBLACK_EX + fp_json_path.lstrip(relative_root)

    different_versions = root_pnpm_version != frontend_pnpm_version
    if should_fix_version:
        if different_versions:
            print(f"Fixing {pm_str} in {formatted_root} to match {formatted_frontend}.")
            root_package_json["packageManager"] = frontend_pnpm_version
            with open(root_package_json_path, "w") as f:
                json.dump(root_package_json, f, indent=2)
    else:
        if different_versions:
            ERROR_STRING = Fore.RED + "ERROR:" + Fore.RESET
            print(
                f"{ERROR_STRING} The {pm_str} field in {formatted_root}",
                f"does not match the value in {formatted_frontend}.",
            )

            truncated_root_version = (
                root_pnpm_version[:10] + "..." + root_pnpm_version[-4:]
            )
            truncated_frontend_version = (
                frontend_pnpm_version[:10] + "..." + frontend_pnpm_version[-4:]
            )
            print(f"{formatted_root}: {truncated_root_version}")
            print(f"{formatted_frontend}: {truncated_frontend_version}")
            sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    should_fix_version = "--fix" in sys.argv
    main(should_fix_version)
