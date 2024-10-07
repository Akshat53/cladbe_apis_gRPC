import { database } from "firebase-admin";
import admin from "../config/firebase";

export enum RealtimeDataFilterType {
  equalTo,
  startAt,
  endAt,
}

export interface RealtimeDataFilter {
  value: any;
  filter: RealtimeDataFilterType;
  field: string;
}

class RealtimeDbDataModel {
  docPath: string;
  dbRef: database.Reference;

  constructor(docPath: string, databaseUrl?: string) {
    this.docPath = docPath;
    this.dbRef = admin.database(databaseUrl).ref(docPath);
  }

  processFilter(
    query: database.Query,
    filters: RealtimeDataFilter[]
  ): database.Query {
    filters.forEach((filter) => {
      switch (filter.filter) {
        case RealtimeDataFilterType.equalTo:
          query = query.orderByChild(filter.field).equalTo(filter.value);
          break;
        case RealtimeDataFilterType.startAt:
          query = query.orderByChild(filter.field).startAt(filter.value);
          break;
        case RealtimeDataFilterType.endAt:
          query = query.orderByChild(filter.field).endAt(filter.value);
          break;
      }
    });
    return query;
  }

  async addData(
    data: Record<string, any>,
    docName: string,
    merge: boolean = false
  ): Promise<void> {
    if (merge) {
      await this.dbRef.child(docName).update(data);
    } else {
      await this.dbRef.child(docName).set(data);
    }
  }

  async deleteField(docName: string, fieldName: string): Promise<void> {
    await this.dbRef.child(docName).child(fieldName).remove();
  }

  async getData(options?: {
    fromStart?: boolean;
    filter?: RealtimeDataFilter[];
    limit?: number;
  }): Promise<any> {
    const { fromStart = false, filter, limit } = options || {};
    let query: database.Query = this.dbRef;

    if (filter) {
      query = this.processFilter(query, filter);
    }

    if (limit) {
      query = fromStart ? query.limitToFirst(limit) : query.limitToLast(limit);
    }

    const snapshot = await query.once("value");
    return snapshot.val();
  }

  getDataStream(
    callback: (data: any) => void,
    options?: {
      fromStart?: boolean;
      filter?: RealtimeDataFilter[];
      limit?: number;
    }
  ): () => void {
    const { fromStart = false, filter, limit } = options || {};
    let query: database.Query = this.dbRef;

    if (filter) {
      query = this.processFilter(query, filter);
    }

    if (limit) {
      query = fromStart ? query.limitToFirst(limit) : query.limitToLast(limit);
    }

    const onValue = (snapshot: database.DataSnapshot) => {
      callback(snapshot.val());
    };

    query.on("value", onValue);

    return () => {
      query.off("value", onValue);
    };
  }

  getSingleDocumentStream(
    docName: string,
    callback: (data: any) => void
  ): () => void {
    const onValue = (snapshot: database.DataSnapshot) => {
      callback(snapshot.val());
    };

    this.dbRef.child(docName).on("value", onValue);

    return () => {
      this.dbRef.child(docName).off("value", onValue);
    };
  }

  async updateField(
    update: Record<string, any>,
    docName: string
  ): Promise<void> {
    await this.dbRef.child(docName).update(update);
  }
}

export default RealtimeDbDataModel;
