import axios from "axios";
import { parseJSON } from "utils";

export const axiosInstance = axios.create({ transformResponse: [parseJSON] });
