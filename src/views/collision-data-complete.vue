<template>
  <div class="collision-data">
    <div class="database-container" v-if="treeList.length > 0">
      <!-- Left Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <span class="title">数据库目录</span>
        </div>
        <div class="tree-container" v-loading="treeLoading">
          <el-tree
            ref="tree"
            :indent="10"
            :data="treeList"
            :props="defaultProps"
            highlight-current
            :default-expanded-keys="expandedKeys"
            show-checkbox
            expand-on-click-node
            class="custom-tree"
            node-key="id"
            :render-after-expand="false"
            @node-click="handleNodeClick"
            @check="handleCheck"
            @node-expand="handleNodeExpand"
            @node-collapse="handleNodeCollapse"
          >
            <span
              class="custom-tree-node"
              slot-scope="{ node, data }"
            >
              <svg-icon v-if="getIcon(data)" :icon-class="getIcon(data)" class="node-icon"></svg-icon>
              <span :class="{ 'no-icon': !getIcon(data) }">{{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </div>

      <!-- Right Content -->
      <div class="main-content">
        <div class="content-header" v-if="selectedCategory">
          <span class="title">碰撞结果明细</span>
          <el-button
            size="small"
            icon="el-icon-download"
            class="save-btn"
            @click="handleOpenSaveMiddle"
          >保存中间库</el-button>
        </div>

        <!-- Empty State -->
        <div class="empty-state" v-if="tableData.length === 0">
          <div class="empty-content">
            <svg
              width="200"
              height="160"
              viewBox="0 0 160 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- Clouds -->
              <path
                d="M40 40C40 35 45 32 50 32C52 32 54 33 55 34C57 30 62 28 67 28C74 28 80 33 80 40C80 41 79 42 78 43C80 43 82 45 82 47C82 50 80 52 77 52H40C37 52 35 50 35 47C35 44 37 40 40 40Z"
                fill="#F0F5FF"
              />
              <path
                d="M120 45C120 42 123 40 126 40C128 40 129 41 130 42C131 39 134 38 137 38C141 38 145 41 145 45C145 46 144 47 143 47C145 47 146 49 146 50C146 52 145 54 142 54H120C118 54 116 52 116 50C116 48 118 45 120 45Z"
                fill="#F0F5FF"
              />

              <!-- Sparkles -->
              <path d="M90 30L92 22L100 20L92 18L90 10L88 18L80 20L88 22L90 30Z" fill="#FFC53D" />
              <path
                d="M105 25L106 20L111 19L106 18L105 13L104 18L99 19L104 20L105 25Z"
                fill="#FFC53D"
              />

              <!-- Box -->
              <path d="M80 50L115 65L115 95L80 80L80 50Z" fill="#A3C2FF" />
              <path d="M80 50L45 65L45 95L80 80L80 50Z" fill="#8CB3FF" />
              <path d="M80 50L115 65L95 75L60 60L80 50Z" fill="#D6E4FF" />
              <path d="M45 65L80 50L60 40L25 55L45 65Z" fill="#B8D0FF" />
              <path d="M115 65L80 50L100 40L135 55L115 65Z" fill="#C7DAFF" />
              <path d="M80 105L115 95L95 85L60 95L80 105Z" fill="#7AA3FF" />
              <path d="M80 105L45 95L65 85L100 95L80 105Z" fill="#6694FF" />
              <path d="M45 95L80 105L80 80L45 65L45 95Z" fill="#5285FF" />
              <path d="M115 95L80 105L80 80L115 65L115 95Z" fill="#3D76FF" />

              <!-- Trees -->
              <path
                d="M35 85C35 80 38 75 42 75C46 75 49 80 49 85C49 90 46 95 42 95C38 95 35 90 35 85Z"
                fill="#A3C2FF"
              />
              <path d="M42 95L42 105" stroke="#A3C2FF" stroke-width="2" />
              <path
                d="M120 80C120 76 122.5 72 126 72C129.5 72 132 76 132 80C132 84 129.5 88 126 88C122.5 88 120 84 120 80Z"
                fill="#A3C2FF"
              />
              <path d="M126 88L126 98" stroke="#A3C2FF" stroke-width="2" />
            </svg>
            <div class="empty-text">暂无数据！</div>
          </div>
        </div>

        <!-- Table Content -->
        <div class="table-container" v-else v-loading="tableLoading">
          <sm-table
            :tableData="tableData"
            :tableColumn="currentColumns"
            style="width: 100%"
            height="100%"
            class="custom-table"
            :pagination="true"
            node-key="id"
            :currentPage.sync="pages.pageIndex"
            :pageSize.sync="pages.pageSize"
            :tableDataTotal="total"
            @changePage="queryTableData"
            :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }"
          >
            <template slot-scope="scope" slot="operate">
              <!-- Custom rendering based on column type -->
              <div class="action-cell">
                <el-button type="text" size="small" class="view-btn" @click="handleJump(scope)">查看</el-button>
              </div>
            </template>
          </sm-table>
        </div>

        <!-- 保存中间库 dialog -->
        <!-- <save-middle-base ref="middleBaseRef" /> -->
      </div>
    </div>

    <div class="empty-state" v-else>
      <div class="empty-header">碰撞结果明细</div>
      <div class="empty-content">
        <svg
          width="200"
          height="160"
          viewBox="0 0 160 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Clouds -->
          <path
            d="M40 40C40 35 45 32 50 32C52 32 54 33 55 34C57 30 62 28 67 28C74 28 80 33 80 40C80 41 79 42 78 43C80 43 82 45 82 47C82 50 80 52 77 52H40C37 52 35 50 35 47C35 44 37 40 40 40Z"
            fill="#F0F5FF"
          />
          <path
            d="M120 45C120 42 123 40 126 40C128 40 129 41 130 42C131 39 134 38 137 38C141 38 145 41 145 45C145 46 144 47 143 47C145 47 146 49 146 50C146 52 145 54 142 54H120C118 54 116 52 116 50C116 48 118 45 120 45Z"
            fill="#F0F5FF"
          />

          <!-- Sparkles -->
          <path d="M90 30L92 22L100 20L92 18L90 10L88 18L80 20L88 22L90 30Z" fill="#FFC53D" />
          <path d="M105 25L106 20L111 19L106 18L105 13L104 18L99 19L104 20L105 25Z" fill="#FFC53D" />

          <!-- Box -->
          <path d="M80 50L115 65L115 95L80 80L80 50Z" fill="#A3C2FF" />
          <path d="M80 50L45 65L45 95L80 80L80 50Z" fill="#8CB3FF" />
          <path d="M80 50L115 65L95 75L60 60L80 50Z" fill="#D6E4FF" />
          <path d="M45 65L80 50L60 40L25 55L45 65Z" fill="#B8D0FF" />
          <path d="M115 65L80 50L100 40L135 55L115 65Z" fill="#C7DAFF" />
          <path d="M80 105L115 95L95 85L60 95L80 105Z" fill="#7AA3FF" />
          <path d="M80 105L45 95L65 85L100 95L80 105Z" fill="#6694FF" />
          <path d="M45 95L80 105L80 80L45 65L45 95Z" fill="#5285FF" />
          <path d="M115 95L80 105L80 80L115 65L115 95Z" fill="#3D76FF" />

          <!-- Trees -->
          <path
            d="M35 85C35 80 38 75 42 75C46 75 49 80 49 85C49 90 46 95 42 95C38 95 35 90 35 85Z"
            fill="#A3C2FF"
          />
          <path d="M42 95L42 105" stroke="#A3C2FF" stroke-width="2" />
          <path
            d="M120 80C120 76 122.5 72 126 72C129.5 72 132 76 132 80C132 84 129.5 88 126 88C122.5 88 120 84 120 80Z"
            fill="#A3C2FF"
          />
          <path d="M126 88L126 98" stroke="#A3C2FF" stroke-width="2" />
        </svg>
        <div class="empty-text">暂无数据！</div>
      </div>
    </div>

    <!-- <FaceDialog ref="faceRef" /> -->
  </div>
</template>

<script>
// import SaveMiddleBase from "./saveMiddleBase/index.vue";
import { normalizeTreeData } from "./helper";
// import FaceDialog from "./faceDialog/index.vue";

export default {
  name: "DatabaseView",
  // components: { SaveMiddleBase, FaceDialog },
  data() {
    return {
      tableLoading: false,
      treeLoading: false,
      selectedCategory: null,
      selectedNode: null,
      rootNode: null, // 当前选中的顶级父节点
      parentNode: null, // 当前选中的直接父节点
      checkedNodes: [], // 复选框选中的节点数据
      expandedKeys: [], // 展开的节点 key 数组
      defaultProps: {
        children: "children",
        label: "nodeName"
      },
      pages: {
        pageIndex: 1,
        pageSize: 10
      },
      total: 0,
      treeList: [],
      currentColumns: [],
      tableData: [],
      ftSearchDict: {}
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    // 收集所有节点的 ID（用于默认全部展开）
    collectAllNodeIds(nodes, ids = []) {
      if (!nodes || nodes.length === 0) return ids;
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          ids.push(node.id);
          this.collectAllNodeIds(node.children, ids);
        }
      });
      return ids;
    },

    // 节点展开事件
    handleNodeExpand(data, node) {
      console.log('Node expanded:', data.id);
      if (!this.expandedKeys.includes(data.id)) {
        this.expandedKeys.push(data.id);
      }
    },

    // 节点收起事件
    handleNodeCollapse(data, node) {
      console.log('Node collapsed:', data.id);
      const index = this.expandedKeys.indexOf(data.id);
      if (index > -1) {
        this.expandedKeys.splice(index, 1);
      }
    },

    // 递归查找第一个叶子节点
    findFirstLeaf(nodes) {
      if (!nodes || nodes.length === 0) return null;
      for (const node of nodes) {
        // 如果没有子节点或子节点为空，则是叶子节点
        if (!node.children || node.children.length === 0) {
          return node;
        }
        // 递归查找子节点
        const leaf = this.findFirstLeaf(node.children);
        if (leaf) return leaf;
      }
      return null;
    },

    // 自动选中第一个叶子节点
    autoSelectFirstLeaf(treeData) {
      console.log('autoSelectFirstLeaf called', treeData);
      const firstLeaf = this.findFirstLeaf(treeData);
      console.log('firstLeaf:', firstLeaf);
      if (firstLeaf && firstLeaf.resultTable) {
        this.selectedCategory = firstLeaf.nodeType;
        // 设置选中节点及其顶级父节点
        this.setSelectedNode(firstLeaf);
        this.$nextTick(() => {
          console.log('tree ref:', this.$refs.tree);
          if (this.$refs.tree) {
            this.$refs.tree.setCurrentKey(firstLeaf.id);
          }
          // 请求表格数据
          this.queryTableData();
        });
      }
    },

    // 递归查找节点的直接父节点
    findParentNode(nodes, targetNode, parent = null) {
      if (!nodes || nodes.length === 0) return null;
      for (const node of nodes) {
        if (node.id === targetNode.id) {
          return parent;
        }
        if (node.children && node.children.length > 0) {
          const found = this.findParentNode(node.children, targetNode, node);
          if (found !== null) return found;
        }
      }
      return null;
    },

    // 递归查找节点的顶级父节点（根节点）
    findRootNode(nodes, targetNode) {
      if (!nodes || nodes.length === 0) return null;
      for (const node of nodes) {
        if (node.id === targetNode.id) {
          return node;
        }
        if (node.children && node.children.length > 0) {
          const root = this.findRootNode(node.children, targetNode);
          if (root) return node;
        }
      }
      return null;
    },

    // 设置选中节点及其父节点
    setSelectedNode(data) {
      this.selectedNode = data;
      // 顶级父节点
      this.rootNode = this.findRootNode(this.treeList, data) || data;
      // 直接父节点
      this.parentNode = this.findParentNode(this.treeList, data);
    },

    queryTableData() {
      this.tableLoading = true;
      const { nodeCode } = this.rootNode;
      const { resultTable, id } = this.selectedNode;
      const params = {
        pageRule: {
          pageIndex: this.pages.pageIndex,
          pageSize: this.pages.pageSize
        },
        resultTable,
        taskId: this.$route.query.taskId
      };

      // this.$axiosJsonPost(API.fetchGetBaseDataSearchPage, params)
      //   .then(res => {
      //     const { total: result_total, columnMap, resultMap } = res;
      //     this.total = result_total;

      //     //  判断在 人员库 邮件库 资料库 人脸库 需要添加查看入口
      //     if (["person", "mail", "filebank", "facebank"].includes(nodeCode)) {
      //       this.currentColumns = [
      //         ...columnMap,
      //         { prop: "operate", label: "操作" }
      //       ];
      //     } else {
      //       this.currentColumns = columnMap;
      //     }

      //     this.tableData = resultMap;
      //   })
      //   .catch(() => {
      //     this.currentColumns = [];
      //     this.tableData = [];
      //   })
      //   .finally(() => {
      //     this.tableLoading = false;
      //   });
    },

    // 懒加载树节点数据
    loadData() {
      // this.treeLoading = true;
      // const taskId = this.$route.query.taskId;
      // console.log('loadData taskId:', taskId);
      // const params = { taskId };
      const res = [

        {

            "id": "base-library",

            "parentId": "base-library",

            "nodeType": "catalog",

            "nodeName": "基础库",

            "nodeCode": "base-library",

            "resultTable": null,

            "childNodes": [

                {

                    "id": "catalog_common",

                    "parentId": null,

                    "nodeType": "catalog",

                    "nodeName": "通用",

                    "nodeCode": "common",

                    "resultTable": null,

                    "childNodes": [

                        {

                            "id": "catalog_1001",

                            "parentId": null,

                            "nodeType": "catalog",

                            "nodeName": "出入境",

                            "nodeCode": null,

                            "resultTable": null,

                            "childNodes": [

                                {

                                    "id": "table_90334",

                                    "parentId": null,

                                    "nodeType": "table",

                                    "nodeName": "import_012601",

                                    "nodeCode": "t_dwd_import_012601_di",

                                    "resultTable": "t_dwd_import_012601_di_11",

                                    "childNodes": null

                                }

                            ]

                        }

                    ]

                }

            ]

        },

        {

            "id": "trip-library",

            "parentId": "trip-library",

            "nodeType": "catalog",

            "nodeName": "出行库",

            "nodeCode": "trip-library",

            "resultTable": null,

            "childNodes": [

                {

                    "id": "15",

                    "parentId": null,

                    "nodeType": "table",

                    "nodeName": "泰国出入境",

                    "nodeCode": "t_dwd_tai_outin_info",

                    "resultTable": "t_dwd_tai_outin_info_11",

                    "childNodes": null

                }

            ]

        },

        {

            "id": "person",

            "parentId": "person",

            "nodeType": "catalog",

            "nodeName": "人员库",

            "nodeCode": "person",

            "resultTable": null,

            "childNodes": [

                {

                    "id": "12",

                    "parentId": null,

                    "nodeType": "table",

                    "nodeName": "人员库M1",

                    "nodeCode": "tj-zzpt-person-info",

                    "resultTable": "tj-zzpt-person-info_11",

                    "childNodes": null

                }

            ]

        },

        {

            "id": "filebank",

            "parentId": "filebank",

            "nodeType": "catalog",

            "nodeName": "资料库",

            "nodeCode": "filebank",

            "resultTable": null,

            "childNodes": [

                {

                    "id": "13-common",

                    "parentId": null,

                    "nodeType": "table",

                    "nodeName": "通用",

                    "nodeCode": "common",

                    "resultTable": "tj-zzpt-file-info_11",

                    "childNodes": null

                },

                {

                    "id": "13-r",

                    "parentId": null,

                    "nodeType": "table",

                    "nodeName": "对日",

                    "nodeCode": "r",

                    "resultTable": "tj-zzpt-file-info_11",

                    "childNodes": null

                },

                {

                    "id": "13-m",

                    "parentId": null,

                    "nodeType": "table",

                    "nodeName": "美国",

                    "nodeCode": "m",

                    "resultTable": "tj-zzpt-file-info_11",

                    "childNodes": null

                }

            ]

        },

        {

            "id": "mail",

            "parentId": "mail",

            "nodeType": "catalog",

            "nodeName": "邮件库",

            "nodeCode": "mail",

            "resultTable": null,

            "childNodes": [

                {

                    "id": "11-common",

                    "parentId": null,

                    "nodeType": "table",

                    "nodeName": "通用",

                    "nodeCode": "common",

                    "resultTable": "ujfx-battle_11",

                    "childNodes": null

                },

                {

                    "id": "11-r",

                    "parentId": null,

                    "nodeType": "table",

                    "nodeName": "对日",

                    "nodeCode": "r",

                    "resultTable": "ujfx-battle_11",

                    "childNodes": null

                },

                {

                    "id": "11-m",

                    "parentId": null,

                    "nodeType": "table",

                    "nodeName": "美国",

                    "nodeCode": "m",

                    "resultTable": "ujfx-battle_11",

                    "childNodes": null

                }

            ]

        }

    ];

    console.log('API response:', res);
          const treeData = normalizeTreeData(res || []);
          console.log('treeList after normalize:', treeData);
          this.treeList = treeData;
          
          // 收集所有节点 ID 用于默认展开
          this.expandedKeys = this.collectAllNodeIds(treeData);
          console.log('expandedKeys:', this.expandedKeys);
          
          // 默认选中第一个叶子节点
          this.$nextTick(() => {
            this.autoSelectFirstLeaf(treeData);
          });

      // this.$axiosJsonPost(API.fetchGetcatalogList, params)
      //   .then(res => {
      //     console.log('API response:', res);
      //     const treeData = normalizeTreeData(res || []);
      //     console.log('treeList after normalize:', treeData);
      //     this.treeList = treeData;
          
      //     // 收集所有节点 ID 用于默认展开
      //     this.expandedKeys = this.collectAllNodeIds(treeData);
      //     console.log('expandedKeys:', this.expandedKeys);
          
      //     // 默认选中第一个叶子节点
      //     this.$nextTick(() => {
      //       this.autoSelectFirstLeaf(treeData);
      //     });
      //   })
      //   .catch(() => {
      //     this.treeList = [];
      //   })
      //   .finally(() => {
      //     this.treeLoading = false;
      //   });
    },

    // 点击保存中间库
    handleOpenSaveMiddle() {
      if (this.checkedNodes.length === 0) {
        this.$message.warning("请先勾选左侧数据表");
        return;
      }
      const temp_result = this.checkedNodes.filter(col => col.resultTable);
      if (temp_result.length === 0) {
        this.$message.warning("请先勾选左侧数据表");
        return;
      }

      const result = temp_result.map(col => col.resultTable);
      this.$refs.middleBaseRef.open(result);
    },

    getIcon(data) {
      // 有子节点时显示文件夹图标，叶子节点不显示图标
      if (data.children && data.children.length > 0) return "floder";
      return "";
    },

    // 判断是否为叶子节点：children 不存在或长度为 0
    isLeafNode(data) {
      return !data.children || data.children.length === 0;
    },

    // 复选框勾选事件
    handleCheck(data, checkedInfo) {
      // checkedInfo 包含: checkedNodes, checkedKeys, halfCheckedNodes, halfCheckedKeys
      this.checkedNodes = checkedInfo.checkedNodes || [];
    },

    handleNodeClick(data, node) {
      // 使用 node.isLeaf 判断是否为叶子节点，更可靠
      if (!node.isLeaf) {
        // 清除当前高亮
        this.$refs.tree && this.$refs.tree.setCurrentKey(this.selectedNode?.id);
        return;
      }
      // 叶子节点才能被选中
      if (data.resultTable) {
        this.selectedCategory = data.nodeType;
        this.setSelectedNode(data);
        this.queryTableData();
      } else {
        this.selectedCategory = null;
        this.selectedNode = null;
        this.rootNode = null;
        this.parentNode = null;
      }
    },

    // 跳转
    handleJump(rest) {
      const { row } = rest;
      const { nodeCode } = this.rootNode;
      console.log(rest, "rest --- 0");
      let path = "";
      let query = {};
      
      // 人脸
      if (nodeCode === "facebank") {
        this.$refs.faceRef.open(row);
        return;
      }

      switch (nodeCode) {
        case "mail":
          // 邮件分析详情
          path = "/manageHome/ujDetail";
          query.battleJobId = row.battle_job_id;
          break;
        case "person":
          path = "/manageHome/person/personInfo";
          query.id = row.id;
          query.type = "edit";
          break;
        case "filebank":
          const typeStr = {
            WdType: "textExploration",
            TpType: "imageExploration",
            SpType: "videoExplore",
            YpType: "audioExplore"
          };
          const fileType = this.ftSearchDict?.fileBankFileTypeMap?.[row.file_type];
          const url = `/#/fileManagement/${typeStr[fileType]}?id=${row.id}&t=${Date.now()}`;
          if (url) {
            window.open(url, "_blank");
          }
          return; // 直接返回，不执行下面的逻辑
      }

      // 统一处理 mail 和 person 的跳转
      if (path) {
        const pathInfo = this.$router.resolve({ path, query });
        window.open(pathInfo.href, "_blank");
      }
    }
  }
};
</script>

<style scoped lang="less">
@import url("./index.less");
</style>
