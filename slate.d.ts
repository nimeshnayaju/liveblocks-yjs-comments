import type { BaseEditor, Element, Text } from "slate";
import type { HistoryEditor } from "slate-history";
import type { ReactEditor, RenderElementProps } from "slate-react";

/* -------------------------------------------------------------------------------------------------
 * Slate
 * -----------------------------------------------------------------------------------------------*/
export type CustomElement = ParagraphElement;
export type CustomText = FormattedText;

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

export type FormattedText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  highlighted?: boolean;
};

export type InlineNode = FormattedText;

/* -------------------------------------------------------------------------------------------------
 * Paragraph
 * -----------------------------------------------------------------------------------------------*/
export type ParagraphElement = {
  type: "paragraph";
  children: InlineNode[];
};
