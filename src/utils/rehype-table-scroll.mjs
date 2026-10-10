/**
 * Wrap markdown tables in div.table-scroll so a wide table scrolls
 * inside that wrapper. Hand-written tables already sit in .table-scroll.
 */
function classList(node) {
  const value = node?.properties?.className ?? node?.properties?.class;
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return String(value).split(/\s+/).filter(Boolean);
}

function hasClass(node, name) {
  return classList(node).includes(name);
}

function alreadyWrapped(ancestors) {
  return ancestors.some(
    (node) =>
      node?.type === 'element' &&
      (hasClass(node, 'table-scroll') || hasClass(node, 'katex'))
  );
}

export default function rehypeTableScroll() {
  return (tree) => {
    visit(tree, []);
  };
}

function visit(node, ancestors) {
  if (!node || typeof node !== 'object') return;

  if (
    node.type === 'element' &&
    node.tagName === 'table' &&
    !hasClass(node, 'post-table') &&
    !alreadyWrapped(ancestors)
  ) {
    const parent = ancestors[ancestors.length - 1];
    if (parent && Array.isArray(parent.children)) {
      const index = parent.children.indexOf(node);
      if (index !== -1) {
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'] },
          children: [node],
        };
        return;
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) visit(child, ancestors.concat(node));
  }
}
