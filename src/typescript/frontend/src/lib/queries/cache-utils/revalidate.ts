"use server";

import { revalidateTag } from "next/cache";
import { type TAGS } from "./tags";

export const revalidateTagAction = async (tag: TAGS) => {
  revalidateTag(tag);
};
