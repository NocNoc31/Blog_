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

function plainText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (!Array.isArray(node.children)) return '';
  return node.children.map(plainText).join('');
}

function captionText(table) {
  const caption = (table.children || []).find((child) => child?.type === 'element' && child.tagName === 'caption');
  return plainText(caption).replace(/\s+/g, ' ').trim();
}

function ensureRegion(node, label) {
  const props = node.properties || (node.properties = {});
  if (props.tabIndex == null) props.tabIndex = 0;
  if (!props.role) props.role = 'region';
  if (!props.ariaLabel && !props['aria-label']) props.ariaLabel = label;
}

function scrollWrap(table, label) {
  return {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['table-scroll'],
      tabIndex: 0,
      role: 'region',
      ariaLabel: label,
    },
    children: [table],
  };
}

function visit(node, uniqueLabel) {
  if (!node || typeof node !== 'object' || !Array.isArray(node.children)) return;
  node.children = node.children.map((child) => {
    if (child?.type === 'element' && child.tagName === 'table' && !hasClass(node, 'table-scroll')) {
      return scrollWrap(child, uniqueLabel(captionText(child) || 'Bảng cuộn ngang'));
    }
    return child;
  });
  for (const child of node.children) {
    if (child?.type !== 'element') continue;
    if (hasClass(child, 'katex-display')) ensureRegion(child, uniqueLabel('Công thức toán'));
    if (hasClass(child, 'table-scroll')) {
      const table = (child.children || []).find((item) => item?.type === 'element' && item.tagName === 'table');
      ensureRegion(child, uniqueLabel(captionText(table) || 'Bảng cuộn ngang'));
    }
    visit(child, uniqueLabel);
  }
}

export default function rehypeScrollRegions() {
  return (tree) => {
    const used = new Map();
    const uniqueLabel = (base) => {
      const next = (used.get(base) || 0) + 1;
      used.set(base, next);
      return next === 1 ? base : `${base} ${next}`;
    };
    visit(tree, uniqueLabel);
  };
}
