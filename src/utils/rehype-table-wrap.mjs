import { visit } from 'unist-util-visit';

function hasClass(node, className) {
  const value = node.properties?.className;
  if (Array.isArray(value)) return value.includes(className);
  return typeof value === 'string' && value.split(/\s+/).includes(className);
}

export default function rehypeTableWrap() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index == null) return;
      if (parent.tagName === 'div' && hasClass(parent, 'table-scroll')) return;

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      };
    });
  };
}
