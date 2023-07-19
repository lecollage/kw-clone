import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  createClient,
  REALTIME_LISTEN_TYPES,
  RealtimePostgresChangesPayload,
  RealtimePostgresInsertPayload,
  SupabaseClient,
} from '@supabase/supabase-js';
import * as Y from 'yjs';
import { applyUpdate } from 'yjs';
import { ulid } from 'ulid';

import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import {
  CellClickedEvent,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  ColDef,
  GetRowIdFunc,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  RowEditingStartedEvent,
  RowEditingStoppedEvent,
} from 'ag-grid-community';

type Primitive = string | number | Date | boolean;

interface DocumentRow {
  id: number;
  clientId: string;
  documentId: string;
  serialized_document: number[];
  created_at: string;
}

interface Row {
  id: string;
  make: string;
  model: string;
  price: number;
}

// https://www.ag-grid.com/angular-data-grid/row-dragging-to-grid/

@Component({
  standalone: true,
  imports: [RouterModule, AgGridModule],
  selector: 'kawa-clone-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private gridApi!: GridApi;

  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  public getRowId: GetRowIdFunc = (params: GetRowIdParams) => params.data.id;

  public defaultColDef: ColDef = {
    flex: 1,
    minWidth: 110,
    sortable: true,
    filter: true,
    editable: true,
    resizable: true,
  };

  public columnDefs: ColDef[] = [
    { valueGetter: 'node.id', hide: true },
    { field: 'make' },
    { field: 'model' },
    { field: 'price' },
  ];

  public rows: Row[] = [];

  public supabase: SupabaseClient = createClient(
    'https://jeburdjwgjhkotxakjjf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplYnVyZGp3Z2poa290eGFrampmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODgzMzU4MjgsImV4cCI6MjAwMzkxMTgyOH0.ZwxfY__MpAyn7VO1SjOPVxHaAABsDw3Qpoy_CyNS-uM'
  );

  private currentDocumentId = 'delta-01H5DVT35RVFGHME0K4FFC0NGK'; //`delta-${ulid()}`;

  public currentClientId = `client-${ulid()}`;

  private ydoc = new Y.Doc();

  public async ngOnInit() {
    console.log(
      `ngOnInit >> ID:`,
      this.currentDocumentId,
      this.currentClientId
    );

    await this.initDocData();
    this.initListeners();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  updateDocument(): void {}

  onCellClicked(e: CellClickedEvent): void {}

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

  public onCellEditingStopped(event: CellEditingStoppedEvent<Row>) {
    console.log();
    console.log('CELL UPDATE 1 >> cellEditingStopped', event);

    if (event.newValue === event.oldValue) {
      return;
    }

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

      this.ydoc.transact((transaction) => {
        if (currentYRow.get(index) !== undefined) {
          currentYRow.delete(index);
        }
        currentYRow.insert(index, [event.newValue]);
        transaction.origin = `CELL-UPDATE | DOC.ID:${this.currentDocumentId} | CLIENT.ID:${this.currentClientId}`;
      });

      // console.log(spreadsheet.toJSON());
    }
  }

  private processDBUpdate(
    payload: RealtimePostgresInsertPayload<DocumentRow>
  ): void {
    const data = payload.new;

    if (data.clientId === this.currentClientId) {
      // console.log(`POSTGRES_CHANGES 2 >> the same clientId, return`);
      return;
    }

    console.log(`POSTGRES_CHANGES 1 >> `, payload);

    const preparedData = data ? data.serialized_document : [];
    const uint8Array = new Uint8Array(preparedData);

    // APPLY UPDATE TO THE OLD DOC
    this.ydoc.transact((transaction) => {
      applyUpdate(this.ydoc, uint8Array);
      transaction.origin = `DB-UPDATE | DOC.ID:${this.currentDocumentId} | CLIENT.ID:${this.currentClientId}`;
    });
  }

  private async initDocData(): Promise<void> {
    // SELECT DB DATA
    const { data } = await this.supabase
      .from('documents')
      .select('*')
      .eq('documentId', this.currentDocumentId)
      .order('created_at');

    console.log(`INIT >> SELECT RESULT: `, data);

    const startingData = (data || []) as DocumentRow[];

    this.ydoc.transact((transaction) => {
      transaction.origin = `INIT | DOC.ID:${this.currentDocumentId} | CLIENT.ID:${this.currentClientId}`;

      startingData.forEach((docRow) => {
        const preparedData = docRow.serialized_document;
        const uint8Array = new Uint8Array(preparedData as number[]);

        Y.logUpdate(uint8Array);

        applyUpdate(this.ydoc, uint8Array);
      });
    });

    const spreadsheet = this.ydoc.getMap<Array<Primitive>>('spreadsheet');

    console.log(`INIT >> PREVIOUS RESULT:`, spreadsheet);
    const rows = [];

    for (const [key, [id, make, model, price]] of spreadsheet) {
      console.log(`INIT >> `, key, { id, make, model, price });
      rows.push({ id, make, model, price });
    }

    this.rows = rows;
  }

  private initListeners(): void {
    this.ydoc.on('update', (delta, y, z) => {
      this.onDocumentUpdate(delta, y, z);
    });

    // SUBSCRIBE TO CHANGES
    this.supabase
      .channel('table_db_changes')
      .on(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        { event: '*', schema: 'public', table: 'documents' },
        (payload: RealtimePostgresChangesPayload<DocumentRow>) => {
          this.processDBUpdate(
            payload as RealtimePostgresInsertPayload<DocumentRow>
          );
        }
      )
      .subscribe((status, error) => {
        console.log(`documents SUBSCRIBE >> status: ${status}; error: `, error);
      });
  }

  private async onDocumentUpdate(
    delta: Uint8Array,
    origin: string,
    doc: Y.Doc
  ): Promise<void> {
    console.log(`LISTENER DOC UPDATE 1 >> `, delta.length, origin, doc);

    Y.logUpdate(delta);

    const spreadsheet = this.ydoc.getMap<Y.Array<Primitive>>('spreadsheet');

    // update grid data
    for (const [key, [id, make, model, price]] of spreadsheet) {
      console.log(`LISTENER DOC UPDATE 2 >> `, key, { id, make, model, price });

      const currGridRow = this.rows.find((row) => row.id === key);
      const gridRowNode = this.gridApi.getRowNode(key);

      console.log(`LISTENER DOC UPDATE 3 >> `, currGridRow, gridRowNode);

      if (currGridRow && gridRowNode) {
        if (currGridRow.make !== make) {
          gridRowNode.setDataValue('make', make);
          currGridRow.make = make;
          console.log(`LISTENER DOC UPDATE 3 >> update of make`);
        }
        if (currGridRow.model !== model) {
          gridRowNode.setDataValue('model', model);
          currGridRow.model = model;
          console.log(`LISTENER DOC UPDATE 3 >> update of model`);
        }
        if (currGridRow.price !== price) {
          gridRowNode.setDataValue('price', price);
          currGridRow.price = price;
          console.log(`LISTENER DOC UPDATE 3 >> update of price`);
        }
      }
    }

    console.log(`LISTENER DOC UPDATE 4 >> rows: `, this.rows);

    if (
      origin ===
      `DB-UPDATE | DOC.ID:${this.currentDocumentId} | CLIENT.ID:${this.currentClientId}`
    ) {
      return;
    }

    // insert to db
    const insertResult = await this.supabase
      .from('documents')
      .insert({
        serialized_document: Array.from(delta),
        documentId: this.currentDocumentId,
        clientId: this.currentClientId,
      })
      .select();

    console.log(`LISTENER DOC UPDATE FINISH >>INSERT RESULT `, insertResult);
  }
}
