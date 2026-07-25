import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SocialEmbedComponent } from '../components/SocialEmbedComponent';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    socialEmbed: {
      setSocialEmbed: (options: { rawHtml: string }) => ReturnType;
    };
  }
}

export const SocialEmbedExtension = Node.create({
  name: 'socialEmbed',
  group: 'block',
  atom: true,
  inline: false,
  isolating: true,

  addAttributes() {
    return {
      rawHtml: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-raw-html'),
        renderHTML: (attributes) => ({
          'data-raw-html': attributes.rawHtml,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-social-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-social-embed': '' }, HTMLAttributes)];
  },

  addCommands() {
    return {
      setSocialEmbed:
        (options) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: options,
            })
            .run();
        },
    };
  },

  addNodeView() {
    // Bridges Tiptap nodes down into React components
    return ReactNodeViewRenderer(SocialEmbedComponent);
  },
});
