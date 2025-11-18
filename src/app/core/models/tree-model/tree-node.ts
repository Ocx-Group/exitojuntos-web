export interface TreeNode {
  // Node
  children: TreeNode[];
  hideChildren?: boolean;
  onClick?: () => void;
  // CSS
  cssClass?: string;
  css?: string;
}

export interface MyTreeNode extends TreeNode {
  id: number;
  user_name: string;
  description?: string;
  image?: string;
  children: MyTreeNode[];
}

export interface MyTreeNodeClient extends TreeNode {
  id: number;
  userName: string;
  description?: string;
  image?: string;
  children: MyTreeNodeClient[];
  qualificationCount?: number;
}
