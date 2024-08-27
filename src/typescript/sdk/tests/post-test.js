const { REMOVE_CONTAINERS_ON_EXIT } = require("./utils/helpers.ts");
const DockerDirector = require("./utils/docker-director.ts").default;

module.exports = async function () {
  if (REMOVE_CONTAINERS_ON_EXIT) {
    await DockerDirector.remove();
  }
};
