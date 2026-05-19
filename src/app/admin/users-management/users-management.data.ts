import { TableConfig } from '@app/shared/components/reusable-datatable/reusable-datatable.component';

export const USERS_TABLE_CONFIG: TableConfig = {
  showSearch: true,
  showActions: true,
  showPagination: true,
  headerHeight: 50,
  footerHeight: 50,
  rowHeight: 'auto',
  limit: 10,
  columnMode: 'force',
  reorderable: true,
};
