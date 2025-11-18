import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MyTreeNodeClient } from '@app/core/models/tree-model/tree-node';
import { ClientUnilevelTreeComponentComponent } from '../unilevel-tree-component/client-unilevel-tree-component.component';
import { AuthService } from '@app/core/service/authentication-service/auth.service';

@Component({
  selector: 'app-view-unilevel-tree',
  templateUrl: './view-unilevel-tree.component.html',
  styleUrls: ['./view-unilevel-tree.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterLink,
    ClientUnilevelTreeComponentComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ViewUnilevelTreeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  userId: number;
  maxLevel: number = 10; // Nivel máximo por defecto
  loading = signal<boolean>(false);
  tree: MyTreeNodeClient = {
    id: 0,
    phone: '',
    email: '',
    imageProfileUrl: '',
    children: [],
  };
  showDiv = false;

  ngOnInit() {
    // Obtener userId de los query params si existe
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['userId']) {
          this.userId = +params['userId'];
        }
        this.loadUnilevelTree();
      });
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

  loadUnilevelTree(maxLevel?: number): void {
    this.loading.set(true);
    this.showDiv = false;

    const levelToLoad = maxLevel || this.maxLevel;

    this.authService
      .getUnilevelTree(this.userId, levelToLoad)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response?.tree) {
            this.tree = this.transformTreeData(response.tree);
            this.showDiv = true;
          }
          this.loading.set(false);
        },
        error: error => {
          console.error('Error al cargar el árbol:', error);
          this.loading.set(false);
        },
      });
  }

  private transformTreeData(treeArray: any[]): MyTreeNodeClient {
    if (!treeArray || treeArray.length === 0) {
      return {
        id: 0,
        phone: 'Sin datos',
        email: 'Sin datos',
        imageProfileUrl: 'assets/images/user.png',
        children: [],
      };
    }

    console.log('Tree data from backend:', treeArray);

    // Crear un mapa de nodos por ID
    const nodesMap = new Map<number, MyTreeNodeClient>();

    // Primera pasada: crear todos los nodos
    for (const node of treeArray) {
      const phoneValue = node.phone || '';
      const emailValue = node.email || '';
      const displayText = phoneValue || emailValue || `Usuario ${node.id}`;

      console.log(`Nodo ${node.id}:`, {
        phone: phoneValue,
        email: emailValue,
        display: displayText,
        imageProfileUrl: node.imageProfileUrl,
      });

      nodesMap.set(node.id, {
        id: node.id,
        phone: phoneValue,
        email: emailValue,
        imageProfileUrl: node.imageProfileUrl || 'assets/images/user.png',
        children: [],
      });
    }

    // Segunda pasada: construir la jerarquía
    let rootNode: MyTreeNodeClient | null = null;
    for (const node of treeArray) {
      const currentNode = nodesMap.get(node.id);
      if (node.father === null) {
        // Este es el nodo raíz
        rootNode = currentNode!;
      } else {
        // Añadir como hijo del padre
        const parentNode = nodesMap.get(node.father);
        if (parentNode && currentNode) {
          parentNode.children.push(currentNode);
        }
      }
    }

    // Inicializar el árbol
    return this.initializeTreeNode(rootNode || nodesMap.values().next().value);
  }

  onloadFamilyTree(userId: number): void {
    this.userId = userId;
    this.loadUnilevelTree();
  }

  loadCompleteTree(): void {
    this.maxLevel = 20; // Cargar todos los niveles
    this.loadUnilevelTree(20);
  }
}
