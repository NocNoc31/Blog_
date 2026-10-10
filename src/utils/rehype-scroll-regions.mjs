/**
 * Make overflow regions keyboard-reachable, and wrap markdown tables so only
 * the table scrolls. Raw HTML tables already inside .table-scroll are left
 * wrapped; this still fills in the region attributes when the HTML is parsed.
 */
function classList(node) {
  const value = node?.properties?.className ?? node?.properties?.class;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  return [];
}

function hasClass(node, name) {
  return classList(node).includes(name);
}

function ensureRegion(node, label) {
  const props = node.properties || (node.properties = {});
  if (props.tabIndex == null) props.tabIndex = 0;
  if (!props.role) props.role = 'region';
  if (!props.ariaLabel && !props['aria-label']) props.ariaLabel = label;
}

function scrollWrap(table) {
  return {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['table-scroll'],
      tabIndex: 0,
      role: 'region',
      ariaLabel: 'Bảng cuộn ngang',
    },
    children: [table],
  };
}

function visit(node) {
  if (!node || typeof node !== 'object' || !Array.isArray(node.children)) return;
  node.children = node.children.map((child) => {
    if (child?.type === 'element' && child.tagName === 'table' && !hasClass(node, 'table-scroll')) {
      return scrollWrap(child);
    }
    return child;
  });
  for (const child of node.children) {
    if (child?.type !== 'element') continue;
    if (hasClass(child, 'katex-display')) ensureRegion(child, 'Công thức toán');
    if (hasClass(child, 'table-scroll')) ensureRegion(child, 'Bảng cuộn ngang');
    visit(child);
  }
}

export default function rehypeScrollRegions() {
  return (tree) => visit(tree);
}
