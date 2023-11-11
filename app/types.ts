import { MdStringObject } from "notion-to-md/build/types";

export type Post = {
  id: string;
  title: string;
  tags: Array<string>;
  description: string;
  date: string;
  slug: string;
  markdown: MdStringObject;
};