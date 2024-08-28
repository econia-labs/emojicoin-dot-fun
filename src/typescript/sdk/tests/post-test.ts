import { REMOVE_CONTAINERS_ON_EXIT } from "./utils/helpers";
import { DockerDirector } from "./utils/docker-director";

export default async function postTest() {
  if (REMOVE_CONTAINERS_ON_EXIT) {
    await DockerDirector.remove();
  }
}
