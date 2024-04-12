# cspell:words zsplit
import os

from identify import identify
from pre_commit import git as precommit_git
from pre_commit import util as precommit_utils


def is_python_file(file: str) -> bool:
    return os.path.isfile(file) and "python" in identify.tags_from_path(file)


def is_non_empty_string(s: str):
    return len(s) > 0


def get_git_root() -> str:
    return precommit_git.get_root()


def git_ls_files(abs_paths=False) -> list[str]:
    root = precommit_git.get_root()
    all_files = precommit_git.zsplit(
        precommit_utils.cmd_output("git", "-C", root, "ls-files", "-z")[1]
    )
    return [os.path.join(root, fp) if abs_paths else fp for fp in all_files]


def get_changed_files() -> set[str]:
    diff_cmd = ("git", "diff", "--name-only", "--no-ext-diff", "-z")
    diff_cmd_output = precommit_utils.cmd_output(*diff_cmd)[1]
    return set(precommit_git.zsplit(diff_cmd_output))
