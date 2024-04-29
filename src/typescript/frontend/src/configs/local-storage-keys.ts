import packages from "../../package.json";

const LOCAL_STORAGE_KEYS = {
  theme: `${packages.name}_theme`,
  language: `${packages.name}_language`,
};

export default LOCAL_STORAGE_KEYS;
