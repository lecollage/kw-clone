import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  createClient,
  REALTIME_LISTEN_TYPES,
  SupabaseClient,
} from '@supabase/supabase-js';

import * as Y from 'yjs';
import { applyUpdate, encodeStateAsUpdate } from 'yjs';

import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import {
  CellClickedEvent,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  ColDef,
  GridReadyEvent,
  RowEditingStartedEvent,
  RowEditingStoppedEvent,
} from 'ag-grid-community';
import { YMap } from 'yjs/dist/src/types/YMap';

type Primitive = string | number | Date | boolean;
type TableRows = Array<Record<string, Primitive>>;

interface Table {
  id: string;
  header: string;
  rows: TableRows;
}

type Tables = Array<Table>;

interface Row {
  id: string;
  make: string;
  model: string;
  price: number;
}

@Component({
  standalone: true,
  imports: [RouterModule, AgGridModule],
  selector: 'kawa-clone-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  public defaultColDef: ColDef = {
    flex: 1,
    minWidth: 110,
    sortable: true,
    filter: true,
    editable: true,
    resizable: true,
  };

  public columnDefs: ColDef[] = [
    { headerName: 'Row ID', valueGetter: 'node.id' },
    { field: 'make' },
    { field: 'model' },
    { field: 'price' },
  ];

  public rowData: Row[] = [];

  public title = 'kawa-clone';

  public supabase: SupabaseClient = createClient(
    'https://jeburdjwgjhkotxakjjf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplYnVyZGp3Z2poa290eGFrampmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODgzMzU4MjgsImV4cCI6MjAwMzkxMTgyOH0.ZwxfY__MpAyn7VO1SjOPVxHaAABsDw3Qpoy_CyNS-uM'
  );

  // private currentCode = `test${Math.floor(Math.random() * (100 - 1 + 1)) + 1}`;
  private currentCode = `test83`;

  private ydoc = new Y.Doc();

  public async ngOnInit() {
    // let { data: user_presence, error } = await this.supabase
    //   .from('user_presence')
    //   .select('id');
    //
    // console.log(user_presence, error);
    //
    // const userPresence = this.supabase
    //   .channel('custom-all-channel')
    //   .on(
    //     REALTIME_LISTEN_TYPES.POSTGRES_CHANGES as any,
    //     { event: '*', schema: 'public', table: 'user_presence' },
    //     (payload) => {
    //       console.log('Change received!', payload);
    //     }
    //   )
    //   .subscribe((payload) => {
    //     console.log('SUBSCRIBE >> ', payload);
    //   });

    ///////////////////////////

    // const ydoc = new Y.Doc();
    // const ymap = ydoc.getMap<Tables>('table');
    //
    // ymap.observe((ymapEvent) => {
    //   ymapEvent.target === ymap; // => true
    //
    //   // Find out what changed:
    //   // Option 1: A set of keys that changed
    //   ymapEvent.keysChanged; // => Set<strings>
    //   // Option 2: Compute the differences
    //   ymapEvent.changes.keys; // => Map<string, { action: 'add'|'update'|'delete', oldValue: any}>
    //
    //   // sample code.
    //   ymapEvent.changes.keys.forEach((change, key) => {
    //     console.log(`action >> `, change.action);
    //
    //     if (change.action === 'add') {
    //       console.log(
    //         `Property "${key}" was added. Initial value: "${JSON.stringify(
    //           ymap.get(key)
    //         )}".`
    //       );
    //     } else if (change.action === 'update') {
    //       console.log(
    //         `Property "${key}" was updated. New value: "${JSON.stringify(
    //           ymap.get(key)
    //         )}". Previous value: "${JSON.stringify(change.oldValue)}".`
    //       );
    //     } else if (change.action === 'delete') {
    //       console.log(
    //         `Property "${key}" was deleted. New value: undefined. Previous value: "${JSON.stringify(
    //           change.oldValue
    //         )}".`
    //       );
    //     }
    //   });
    // });
    //
    // const KEY_TABLES = 'tables';
    // const rowIndex = 0;
    // const tableId = 'table-1';
    //
    // // const spreadsheet: TableRow = { cell1: 1, cell2: 'test1' };
    // // const row2: TableRow = { cell1: 2, cell2: 'test2' };
    // const rows: TableRows = [{ cell1: 1, cell2: 'test1' }];
    // const initTables: Tables = [
    //   {
    //     id: 'table-1',
    //     header: 'Table 1',
    //     rows,
    //   },
    // ];
    //
    // // Common methods
    // ymap.set(KEY_TABLES, initTables);
    //
    // const tables = ymap.get(KEY_TABLES);
    //
    // if (!tables) {
    //   return;
    // }
    //
    // const tableData = tables.find((t) => t.id === tableId);
    //
    // if (!tableData) {
    //   return;
    // }
    //
    // const newRow = { ...tableData.rows[0], cell2: 'test3' };
    // const newRows = tableData.rows.map((row, i) =>
    //   i === rowIndex ? newRow : row
    // );
    // const newTables = tables.map((t) =>
    //   t.id === tableId ? { ...t, rows: newRows } : t
    // );
    // ymap.set(KEY_TABLES, newTables);
    //
    // console.log(ymap.toJSON());

    {
      // SELECT DB DATA
      const { data: startingData } = await this.supabase
        .from('documents')
        .select('*')
        .eq('code', this.currentCode);

      console.log(`INIT >> SELECT RESULT: `, startingData);

      const preparedData = startingData
        ? startingData[0]['serialized_document']
        : [];

      console.log(`INIT >> PREPARED RESULT: `, preparedData);
      const uint8Array = new Uint8Array(preparedData as number[]);
      console.log(`INIT >> SELECTED RESULT to Uint8Array:`, uint8Array);

      // APPLY UPDATE TO THE OLD DOC
      applyUpdate(this.ydoc, uint8Array);

      const previousResult =
        this.ydoc.getMap<YMap<Array<Primitive>>>('spreadsheet');

      console.log(`INIT >> PREVIOUS RESULT:`, previousResult);
      const rows = [];

      for (const [key, [id, make, model, price]] of previousResult) {
        console.log(`INIT >> `, key, { id, make, model, price });
        rows.push({ id, make, model, price });
      }

      this.rowData = rows;
    }

    ///

    // SUBSCRIBE TO CHANGES
    this.supabase
      .channel('table_db_changes')
      .on(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          this.processUpdate(payload);
        }
      )
      .subscribe((payload, error) => {
        console.log(
          'documents SUBSCRIBE >> payload: ',
          payload,
          `; error: `,
          error
        );
      });

    // // BEGIN DOC
    // const ydoc = new Y.Doc();
    //
    // const spreadsheet = ydoc.getMap<Array<Primitive>>('spreadsheet');
    //
    // // INSERT FIRST DATA
    // spreadsheet.set('row-0', [0, 1]);
    //
    // console.log(ydoc.isSynced);
    // console.log(ydoc.store);
    // console.log(spreadsheet.get('row-0'));
    //
    // // save data to DB
    // const serializedDoc = Array.from(encodeStateAsUpdate(ydoc));
    // console.log(serializedDoc);
    //
    // let insertResult = await this.supabase
    //   .from('documents')
    //   .insert({ serialized_document: serializedDoc, code: this.currentCode });
    //
    // console.log(`INSERT RESULT: `, insertResult);
    //
    // // INSERT SECOND DATA
    // spreadsheet.set('row-0', ['row-0', 'Toyota', 'Celica', 35000]);
    // spreadsheet.set('row-1', ['row-1', 'Ford', 'Mondeo', 32000]);
    // spreadsheet.set('row-2', ['row-2', 'Porsche', 'Boxster', 72000]);
    //
    // // UPDATE DB DATA
    // const updateResult = await this.supabase
    //   .from('documents')
    //   .update({ serialized_document: Array.from(encodeStateAsUpdate(ydoc)) })
    //   .eq('code', this.currentCode)
    //   .select();
    //
    // console.log(`UPDATE RESULT: `, updateResult);
    //
    // // SELECT DB DATA
    // const { data: currentData } = await this.supabase
    //   .from('documents')
    //   .select('*')
    //   .eq('code', this.currentCode);
    //
    // console.log(`SELECT RESULT: `, currentData);
    //
    // const preparedData = currentData
    //   ? currentData[0]['serialized_document']
    //   : [];
    //
    // console.log(`PREPARED RESULT: `, preparedData);
    // const uint8Array = new Uint8Array(preparedData as number[]);
    // console.log(`SELECTED RESULT to Uint8Array:`, uint8Array);
    //
    // // APPLY UPDATE TO THE OLD DOC
    // applyUpdate(ydoc, uint8Array);
    //
    // // APPLY UPDATE TO THE NEW DOC
    // const ydocNew = new Y.Doc();
    // applyUpdate(ydocNew, uint8Array);
    //
    // const finalResult1 = ydocNew.getMap<YMap<Array<Primitive>>>('spreadsheet');
    //
    // console.log(`FINAL RESULT:`, finalResult1);
    // const rows = [];
    //
    // for (const [key, [id, make, model, price]] of finalResult1) {
    //   console.log(key, { id, make, model, price });
    //   rows.push({ id, make, model, price });
    // }
    //
    // this.rowData = rows;
  }

  updateDocument(): void {}

  onGridReady(params: GridReadyEvent) {}

  onCellClicked(e: CellClickedEvent): void {}

  // Example using Grid's API
  clearSelection(): void {
    this.agGrid.api.deselectAll();
  }

  onRowEditingStarted(event: RowEditingStartedEvent) {
    console.log('never called - not doing row editing');
  }

  onRowEditingStopped(event: RowEditingStoppedEvent) {
    console.log('never called - not doing row editing');
  }

  onCellEditingStarted(event: CellEditingStartedEvent) {
    console.log('cellEditingStarted');
  }

  async onCellEditingStopped(event: CellEditingStoppedEvent<Row>) {
    console.log();
    console.log('CELL UPDATE >> cellEditingStopped', event);
    console.log('CELL UPDATE >> cellEditingStopped value: ', event.newValue);

    // // SELECT DB DATA
    // const { data: currentData } = await this.supabase
    //   .from('documents')
    //   .select('*')
    //   .eq('code', this.currentCode);
    //
    // console.log(`CELL UPDATE >> SELECT RESULT: `, currentData);
    //
    // const preparedData = currentData
    //   ? currentData[0]['serialized_document']
    //   : [];
    //
    // console.log(`CELL UPDATE >> PREPARED RESULT: `, preparedData);
    // const uint8Array = new Uint8Array(preparedData as number[]);
    // console.log(`CELL UPDATE >> SELECTED RESULT to Uint8Array:`, uint8Array);

    // // APPLY UPDATE
    // applyUpdate(this.ydoc, uint8Array);

    const spreadsheet = this.ydoc.getMap<Array<Primitive>>('spreadsheet');

    console.log(`CELL UPDATE >> spreadsheet:`, spreadsheet);

    if (event.data?.id && spreadsheet.has(event.data?.id || '')) {
      const row = spreadsheet.get(event.data.id);

      if (!row) {
        return;
      }
      const { id, make, model, price } = event.data;
      const newRow = [id, make, model, price];

      console.log(`CELL UPDATE >> newRow: `, newRow);

      spreadsheet.set(event.data.id, newRow);

      // UPDATE DB DATA
      const updateResult = await this.supabase
        .from('documents')
        .update({
          serialized_document: Array.from(encodeStateAsUpdate(this.ydoc)),
        })
        .eq('code', this.currentCode)
        .select();

      console.log(`CELL UPDATE >> UPDATE RESULT: `, updateResult);
    }
  }

  private processUpdate(payload: any) {
    const data = payload.new;

    console.log(`processUpdate >> `, payload);

    const preparedData = data ? data['serialized_document'] : [];

    const uint8Array = new Uint8Array(preparedData as number[]);

    // APPLY UPDATE TO THE OLD DOC
    applyUpdate(this.ydoc, uint8Array);

    const previousResult =
      this.ydoc.getMap<YMap<Array<Primitive>>>('spreadsheet');

    console.log(`processUpdate >> PREVIOUS RESULT:`, previousResult);
    const rows = [];

    for (const [key, [id, make, model, price]] of previousResult) {
      console.log(key, { id, make, model, price });
      rows.push({ id, make, model, price });
    }

    this.rowData = rows;
  }
}
