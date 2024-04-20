#!/usr/bin/env python3
# cspell:words colorama
# cspell:words lightblack
# cspell:words lightgreen
# cspell:words lightred
# cspell:words lightwhite
import os
import re
import sys
from pathlib import Path

import yaml
from colorama import Fore, init

import utils

CASE_REGEXES = {
    "camelCase": r"^([a-z]+[a-zA-Z0-9]*)$",
    "snake_case": r"^(_*[a-z]+[a-z0-9_]*)$",
    "kebab-case": r"^([a-z]+[a-z0-9\-]*)$",
    "PascalCase": r"^([A-Z]+[a-zA-Z0-9]*)$",
    "UPPER_CASE": r"^(_*[A-Z]+[A-Z0-9_]*)$",
    "*": r"^.*$",
}

ERROR_STRING = Fore.RED + "ERROR:" + Fore.RESET
WARNING_STRING = Fore.LIGHTRED_EX + "WARNING:" + Fore.RESET

root = utils.get_git_root()
config_path = Path(os.path.join(root, "cfg/file-name-conventions.yaml"))


def load_config():
    if config_path.exists():
        with open(config_path, "r") as file:
            return yaml.safe_load(file)
    else:
        print(f"{ERROR_STRING} {config_path} not found.")
        sys.exit(1)
    return {}


def main():
    init(autoreset=True)

    config = load_config()
    default_case = config.get("default", "snake_case")
    filetypes = config.get("filetypes", {})
    if len(filetypes) == 0:
        warning_msg = f"No filetypes defined in {config_path}"
        print(WARNING_STRING, warning_msg)
    ignore_files = set(config.get("ignore_files", {}))

    # Validate the user supplied naming conventions against known conventions.
    user_supplied_cases = set(filetypes.values()).union({default_case})
    unrecognized_cases = user_supplied_cases - set(CASE_REGEXES.keys())
    if unrecognized_cases:
        print(ERROR_STRING, end="")
        print(" Unrecognized case in file-name-conventions.yaml")
        print("Unrecognized cases:", ", ".join(unrecognized_cases))
        sys.exit(1)

    # The files are passed as arguments from the pre-commit hook.
    files = [Path(p) for p in sys.argv[1:]]

    # Check the user-supplied file name conventions against each file.
    invalid_file_names = False
    for file_path in files:
        extension = "".join(file_path.suffixes)
        case = filetypes.get(extension, default_case)
        regex = CASE_REGEXES.get(case, default_case)

        if file_path.name in ignore_files:
            continue

        # Check the file name as a Path object against the regex pattern.
        just_file_name = file_path.name.rstrip(extension)
        if not re.match(regex, just_file_name):
            file_dir = file_path.parent
            colored_dir = Fore.LIGHTBLACK_EX + str(file_dir) + "/"
            colored_fp = Fore.LIGHTWHITE_EX + file_path.name
            colored_case = Fore.YELLOW + case
            colored_default_msg = Fore.LIGHTBLACK_EX + "(default)"
            print(ERROR_STRING, end="")
            print(
                f" {colored_dir}{colored_fp}{Fore.LIGHTBLACK_EX}",
                "is not",
                colored_case,
                colored_default_msg,
            )
            invalid_file_names = True

    if invalid_file_names:
        sys.exit(1)
    print()
    print(Fore.LIGHTGREEN_EX + "All file names adhere to naming conventions!")
    sys.exit(0)


if __name__ == "__main__":
    main()
