import git


def get_git_root(path: str) -> git.PathLike:
    repo = git.Repo(path, search_parent_directories=True)
    res = repo.git.working_dir
    if res is None:
        raise ValueError("Could not find `git` root.")

    return res
