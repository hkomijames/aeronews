import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SocialEmbedComponent } from '../components/SocialEmbedComponent';

// 1. Declare commands so TypeScript stops throwing errors on .setSocialEmbed()
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    socialEmbed: {
      setSocialEmbed: (options: { rawHtml: string }) => ReturnType;
    };
  }
}

export const SocialEmbedExtension = Node.create({
  // FIXED: The name must be lowercase camelCase matching your schema types
  name: 'socialEmbed', 
  group: 'block',
  atom: true,
  inline: false,
  isolating: true,

  addAttributes() {
    return {
      rawHtml: {
        default: '',
        // Tells Tiptap how to extract the raw snippet string out of saved DB text
        parseHTML: (element: HTMLElement) => element.getAttribute('data-raw-html'),
        renderHTML: (attributes) => ({
          'data-raw-html': attributes.rawHtml,
        }),
      },
    };
  },

  // FIXED: Tells Tiptap how to look for this node when parsing raw content or HTML strings
  parseHTML() {
    return [
      { 
        tag: 'div[data-social-embed]' 
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // This is the clean fallback output structure that gets saved to your database
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
              attrs: options, // Passes the raw string payload straight to attributes
            })
            .run();
        },
    };
  },

  addNodeView() {
    // Bridges this extension directly to your React layout file
    return ReactNodeViewRenderer(SocialEmbedComponent);
  },
});
