"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

type ImageAlignment = "right" | "center" | "left";

const WIDTHS = [33, 50, 75, 100] as const;

function ImageNodeView({ node, selected, updateAttributes, deleteNode }: NodeViewProps) {
  const width = Number(node.attrs.width) || 100;
  const align = (node.attrs.align || "center") as ImageAlignment;

  return (
    <NodeViewWrapper
      as="figure"
      className={`rich-text-image-node rich-text-image-node--${align} ${selected ? "is-selected" : ""}`}
      data-drag-handle
      data-width={width}
      data-align={align}
      style={{ width: `${width}%` }}
      title="برای جابه‌جایی تصویر را بکشید"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={node.attrs.src} alt={node.attrs.alt || ""} draggable="false" />

      {selected && (
        <div className="rich-text-image-controls" contentEditable={false}>
          <span className="rich-text-image-drag" aria-hidden>⋮⋮</span>
          <div className="rich-text-image-control-group" aria-label="اندازه تصویر">
            {WIDTHS.map((size) => (
              <button
                key={size}
                type="button"
                className={width === size ? "is-active" : ""}
                onClick={() => updateAttributes({ width: size })}
                aria-label={`عرض ${size.toLocaleString("fa-IR")} درصد`}
                title={`عرض ${size.toLocaleString("fa-IR")}٪`}
              >
                {size.toLocaleString("fa-IR")}٪
              </button>
            ))}
          </div>
          <div className="rich-text-image-control-group" aria-label="چیدمان تصویر">
            {([
              ["right", "راست"],
              ["center", "وسط"],
              ["left", "چپ"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={align === value ? "is-active" : ""}
                onClick={() => updateAttributes({ align: value })}
                aria-label={`چیدمان ${label}`}
                title={`چیدمان ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="rich-text-image-remove"
            onClick={deleteNode}
            aria-label="حذف تصویر"
          >
            حذف
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}

const RichTextImage = Node.create({
  name: "richTextImage",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      title: { default: null },
      width: {
        default: 100,
        parseHTML: (element) => Number(element.getAttribute("data-width")) || 100,
        renderHTML: (attributes) => ({ "data-width": attributes.width }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes, { "data-inline-image": "true" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

export default RichTextImage;
