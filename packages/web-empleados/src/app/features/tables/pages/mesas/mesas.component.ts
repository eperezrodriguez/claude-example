import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { AuthStore } from '@resttek/web-shared';
import { OrderStore } from '../../../orders/store/order.store';
import { Order } from '../../../orders/models/order.model';
import { TableStore } from '../../store/table.store';
import { TABLE_STATUSES, TableStatus } from '../../models/table.model';

@Component({
  selector: 'app-mesas',
  standalone: true,
  templateUrl: './mesas.component.html',
  styleUrl: './mesas.component.css'
})
export class MesasComponent implements OnInit, OnDestroy {
  private readonly authStore = inject(AuthStore);
  readonly tableStore = inject(TableStore);
  readonly orderStore = inject(OrderStore);

  readonly statuses = TABLE_STATUSES;

  private readonly restaurantId = computed(() => this.authStore.user()?.restaurantId);

  readonly ordersByTable = computed(() => {
    const map = new Map<string, Order[]>();
    for (const order of this.orderStore.orders()) {
      if (!order.tableId) continue;
      map.set(order.tableId, [...(map.get(order.tableId) ?? []), order]);
    }
    return map;
  });

  ngOnInit(): void {
    const id = this.restaurantId();
    if (id) {
      this.tableStore.loadTables(id);
      this.orderStore.startPolling(id);
    }
  }

  ngOnDestroy(): void {
    this.orderStore.stopPolling();
  }

  ordersFor(tableId: string): Order[] {
    return this.ordersByTable().get(tableId) ?? [];
  }

  itemCount(order: Order, status: string): number {
    return order.items.filter(i => i.status === status).length;
  }

  changeStatus(tableId: string, status: TableStatus): void {
    const id = this.restaurantId();
    if (id) this.tableStore.updateStatus(id, tableId, status);
  }
}
