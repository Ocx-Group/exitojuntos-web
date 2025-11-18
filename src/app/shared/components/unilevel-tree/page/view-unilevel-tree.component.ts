import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';

import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MyTreeNodeClient } from '@app/core/models/tree-model/tree-node';
import { ClientUnilevelTreeComponentComponent } from '../unilevel-tree-component/client-unilevel-tree-component.component';

@Component({
  selector: 'app-view-unilevel-tree',
  templateUrl: './view-unilevel-tree.component.html',
  styleUrls: ['./view-unilevel-tree.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NgbModule,
    ClientUnilevelTreeComponentComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ViewUnilevelTreeComponent implements OnInit {
  userId: number;
  user: UserAffiliate;
  btnBack: boolean = false;
  active;
  isReachedWithdrawalLimit: boolean = false;
  tree: MyTreeNodeClient = {
    id: 0,
    userName: '',
    image: '',
    children: [],
  };
  typeSelected: string = 'cube-transition';
  showDiv = false;

  constructor() {}

  ngOnInit() {
    this.active = 1;
  }

  private initializeTreeNode(node: MyTreeNodeClient): MyTreeNodeClient {
    if (!node) return node;

    // Inicializar hideChildren si no existe
    node.hideChildren ??= false;

    // Asegurar que children existe y es un array
    if (!node.children) {
      node.children = [];
    }

    // Recursivamente inicializar los nodos hijos
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child =>
        this.initializeTreeNode(child),
      );
    }

    return node;
  }

  onTabChange(newActiveId: number) {
    this.active = newActiveId;
    this.btnBack = false;
  }
}
