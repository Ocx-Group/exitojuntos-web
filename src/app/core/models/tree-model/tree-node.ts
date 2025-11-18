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
  phone: string;
  email: string;
  imageProfileUrl?: string;
  children: MyTreeNode[];
}

export interface MyTreeNodeClient extends TreeNode {
  id: number;
  phone: string;
  email?: string;
  imageProfileUrl?: string;
  children: MyTreeNodeClient[];
  qualificationCount?: number;
}
