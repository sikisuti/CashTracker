import { Component, OnInit, inject, signal } from '@angular/core';
import { Transaction } from './transaction.model';
import { TransactionService } from './transaction.service';

@Component({
  selector: 'app-transaction-list',
  imports: [],
  templateUrl: './transaction-list.component.html',
})
export class TransactionListComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  protected readonly transactions = signal<Transaction[]>([]);

  ngOnInit(): void {
    this.transactionService.getAll().subscribe((data) => this.transactions.set(data));
  }
}
