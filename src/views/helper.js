// 生成唯一 ID（如果原始数据没有 id 或 id 重复）
let idCounter = 0;
const generateUniqueId = () => {
  return `tree_node_${Date.now()}_${idCounter++}`;
};

// 规范化树形数据，确保 children 为数组且每个节点都有唯一 id
export const normalizeTreeData = (data, parentId = '') => {
  if (!data || !Array.isArray(data)) return [];
  
  const idSet = new Set();
  
  return data.map((item, index) => {
    // 将 childNodes 转换为 children，避免与 el-tree 内部属性冲突
    const childrenData = item.childNodes || item.children || [];
    const hasChildren = Array.isArray(childrenData) && childrenData.length > 0;
    
    // 确保每个节点都有唯一的 id
    let nodeId = item.id;
    if (!nodeId || idSet.has(nodeId)) {
      nodeId = generateUniqueId();
    }
    idSet.add(nodeId);
    
    // 构建新节点，明确设置所有必要属性
    const node = {
      ...item,
      id: nodeId,
      children: hasChildren ? normalizeTreeData(childrenData, nodeId) : undefined,
      // 不要设置 hasChildren，让 el-tree 自动判断
    };
    
    // 删除原来的 childNodes 属性，避免冲突
    delete node.childNodes;
    
    return node;
  });
};
