import { Node, mergeAttributes } from '@tiptap/core';

export const IframeExtension = Node.create({
  name: 'iframe',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      frameborder: { default: '0' },
      scrolling: { default: 'no' },
      allowtransparency: { default: 'true' },
      allow: { default: 'encrypted-media; autoplay; clipboard-write' },
      class: { default: 'w-full min-h-[450px] rounded-xl border border-slate-800 my-6 bg-white shadow-md' }
    };
  },

  parseHTML() {
    return [{ tag: 'iframe[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { class: 'w-full block clear-both', contenteditable: 'false' },
      ['iframe', mergeAttributes(HTMLAttributes)]
    ];
  },
});
