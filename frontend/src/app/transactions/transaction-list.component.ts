import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FORMATS } from '../locale';
import { Transaction } from './transaction.model';
import { TransactionService } from './transaction.service';

@Component({
  selector: 'app-transaction-list',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './transaction-list.component.html',
})
export class TransactionListComponent implements OnInit {
  protected readonly formats = FORMATS;

  private readonly transactionService = inject(TransactionService);
  protected readonly transactions = signal<Transaction[]>([]);

  ngOnInit(): void {
    this.transactionService.getAll().subscribe((data) => this.transactions.set(data));
  }
}
