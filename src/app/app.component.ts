import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  createClient,
  REALTIME_LISTEN_TYPES,
  SupabaseClient,
} from '@supabase/supabase-js';

import * as Y from 'yjs';
import { applyUpdate } from 'yjs';

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

  public rows: Row[] = [];

  public supabase: SupabaseClient = createClient(
    'https://jeburdjwgjhkotxakjjf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplYnVyZGp3Z2poa290eGFrampmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODgzMzU4MjgsImV4cCI6MjAwMzkxMTgyOH0.ZwxfY__MpAyn7VO1SjOPVxHaAABsDw3Qpoy_CyNS-uM'
  );

  // private currentCode = `test${Math.floor(Math.random() * (100 - 1 + 1)) + 1}`;
  private currentCode = `test83`;

  private ydoc = new Y.Doc();

  public async ngOnInit() {
    // listen to the doc

    this.ydoc.getMap('spreadsheet').observeDeep((event) => {
      console.log(`observeDeep >> `, event);
    });

    {
      // // SELECT DB DATA
      // const { data: startingData } = await this.supabase
      //   .from('documents')
      //   .select('*')
      //   .eq('code', this.currentCode);
      //
      // console.log(`INIT >> SELECT RESULT: `, startingData);
      //
      // const preparedData = startingData
      //   ? startingData[0]['serialized_document']
      //   : [];
      //
      // console.log(`INIT >> PREPARED RESULT: `, preparedData);
      // const uint8Array = new Uint8Array(preparedData as number[]);
      // console.log(`INIT >> SELECTED RESULT to Uint8Array:`, uint8Array);
      //
      // // APPLY UPDATE TO THE OLD DOC
      // applyUpdate(this.ydoc, uint8Array);
      //
      // const dbResult = this.ydoc.getMap<Array<Primitive>>('spreadsheet');
      //
      // console.log(`INIT >> PREVIOUS RESULT:`, dbResult);
      // const rows = [];
      //
      // for (const [key, [id, make, model, price]] of dbResult) {
      //   console.log(`INIT >> `, key, { id, make, model, price });
      //   rows.push({ id, make, model, price });
      // }

      const dbResult: Row[] = [
        { id: 'row-1', make: 'Toyota', model: 'Celica', price: 35000 },
        { id: 'row-2', make: 'Ford', model: 'Mondeo', price: 32000 },
        { id: 'row-3', make: 'Porsche', model: 'Boxster', price: 72000 },
      ];
      const map = this.ydoc.getMap<Y.Array<Primitive>>('spreadsheet');

      for (const { id, make, model, price } of dbResult) {
        console.log(`INIT >> `, { id, make, model, price });
        this.rows.push({ id, make, model, price });
        const arr = new Y.Array<Primitive>();
        arr.push([id, make, model, price]);
        map.set(id, arr);
      }

      console.log(`map >> `, map);

      // this.rows = rows;
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
    console.log('CELL UPDATE 1 >> cellEditingStopped', event);
    console.log('CELL UPDATE 2 >> cellEditingStopped value: ', event.newValue);

    const spreadsheet = this.ydoc.getMap<Y.Array<Primitive>>('spreadsheet');

    console.log(`CELL UPDATE 3 >> spreadsheet:`, spreadsheet);

    if (event.data?.id && spreadsheet.has(event.data?.id || '')) {
      const row = spreadsheet.get(event.data.id);

      if (!row) {
        return;
      }

      const { id, make, model, price } = event.data;
      const newRow = [id, make, model, price];

      console.log(`CELL UPDATE 4 >> newRow: `, newRow);

      const index = this.columnDefs.findIndex((colDef) => {
        console.log(colDef, event.column.getColId());
        return colDef.field === event.column.getColId();
      });

      console.log(`CELL UPDATE 5 >> index: `, index);

      const currentYRow = spreadsheet.get(event.data.id) as Y.Array<Primitive>;

      if (!currentYRow) {
        return;
      }

      currentYRow.delete(index);
      currentYRow.insert(index, [event.newValue]);

      console.log(spreadsheet.toJSON());

      // UPDATE DB DATA
      // const updateResult = await this.supabase
      //   .from('documents')
      //   .update({
      //     serialized_document: Array.from(encodeStateAsUpdate(this.ydoc)),
      //   })
      //   .eq('code', this.currentCode)
      //   .select();
      //
      // console.log(`CELL UPDATE >> UPDATE RESULT: `, updateResult);
    }
  }

  private processUpdate(payload: any) {
    const data = payload.new;

    console.log(`processUpdate >> `, payload);

    const preparedData = data ? data['serialized_document'] : [];
    const uint8Array = new Uint8Array(preparedData as number[]);

    const ydoc2 = new Y.Doc();
    applyUpdate(ydoc2, uint8Array);
    const ydoc3 = new Y.Doc();
    //calculate the difference between 2 docs: local and from DB
    const stateVector1 = Y.encodeStateVector(this.ydoc);
    const stateVector2 = Y.encodeStateVector(ydoc2);
    const diff1 = Y.encodeStateAsUpdate(this.ydoc, stateVector2);
    const diff2 = Y.encodeStateAsUpdate(ydoc2, stateVector1);

    console.log(`processUpdate >> 1 :`, this.ydoc);
    console.log(`processUpdate >> 2 ydoc3 BEFORE:`, ydoc3);
    console.log(`processUpdate >> 3 :`, diff1);

    applyUpdate(ydoc3, diff1);

    console.log(`processUpdate >> 4 ydoc3 AFTER:`, ydoc3);

    const difference = ydoc3.getMap<Array<Primitive>>('spreadsheet');

    console.log(
      `processUpdate >> 5 difference from local with db:`,
      difference
    );

    for (const [key, [id, make, model, price]] of difference) {
      console.log(`processUpdate >> 6 difference from local with db:`, {
        id,
        make,
        model,
        price,
      });
    }

    // APPLY UPDATE TO THE OLD DOC
    applyUpdate(this.ydoc, uint8Array);

    const dbResult = this.ydoc.getMap<Array<Primitive>>('spreadsheet');

    console.log(`processUpdate >> DB RESULT:`, dbResult);
    const rows: Row[] = [];

    for (const [key, [id, make, model, price]] of dbResult) {
      rows.push({ id, make, model, price });
    }

    console.log(`processUpdate >> new rows: `, rows);
    console.log(`processUpdate >> current rows: `, this.rows);

    this.rows = rows;
  }
}
