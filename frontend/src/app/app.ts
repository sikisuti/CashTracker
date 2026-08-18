import { Component } from '@angular/core';
import { TransactionListComponent } from './transactions/transaction-list.component';

@Component({
  selector: 'app-root',
  imports: [TransactionListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
