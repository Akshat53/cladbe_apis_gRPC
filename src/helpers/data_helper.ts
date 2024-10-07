import {
    CollectionReference,
    FieldValue,
    Query,
    Filter,
    DocumentData,
    SetOptions,
    QuerySnapshot,
    Firestore,
    OrderByDirection,
  } from "firebase-admin/firestore";
  import admin, { getFirestoreRef } from "../config/firebase";
  import { Readable } from "stream";
  
  export enum DataFilterType {
    isEqualTo,
    isNotEqualTo,
    isLessThan,
    isLessThanOrEqualTo,
    isGreaterThan,
    isGreaterThanOrEqualTo,
    arrayContains,
    arrayContainsAny,
    whereIn,
    whereNotIn,
  }
  
  export enum DataFilterWrapperType {
    or,
    and,
  }
  
  export interface DataFilter {
    fieldName: string;
    value: any;
    filterType: DataFilterType;
  }
  
  export interface DataFilterWrapper {
    filterWrapperType: DataFilterWrapperType;
    filters: (DataFilterWrapper | DataFilter)[];
  }
  
  export interface DataSort {
    field: string;
    ascending: boolean;
  }
  
  // Type guard for DataFilterWrapper
  function isDataFilterWrapper(obj: any): obj is DataFilterWrapper {
    return (
      (obj as DataFilterWrapper).filters !== undefined &&
      (obj as DataFilterWrapper).filterWrapperType !== undefined
    );
  }
  
  // Type guard for DataFilter
  function isDataFilter(obj: any): obj is DataFilter {
    return (
      (obj as DataFilter).fieldName !== undefined &&
      (obj as DataFilter).filterType !== undefined
    );
  }
  
  export class DataHelper {
    private docPath: string;
    private db: Firestore;
  
    constructor(docPath: string, databaseName?: string) {
      this.docPath = docPath;
      this.db = getFirestoreRef(databaseName);
    }
  
    private processFilters(
      query: Query<DocumentData>,
      dataFilters: (DataFilterWrapper | DataFilter)[],
      type: DataFilterWrapperType
    ): Filter | null {
      const filters: Filter[] = [];
  
      if (dataFilters.every(isDataFilterWrapper)) {
        for (const e of dataFilters) {
          const filter = this.processFilters(
            query,
            e.filters,
            e.filterWrapperType
          );
          if (filter) {
            filters.push(filter);
          }
        }
      } else if (dataFilters.every(isDataFilter)) {
        filters.push(
          this.processFilterType(type, query, dataFilters as DataFilter[])
        );
      }
  
      return filters.length === 0
        ? null
        : filters.length === 1
        ? filters[0]
        : Filter.and(...filters);
    }
  
    private processFilterType(
      type: DataFilterWrapperType,
      query: Query<DocumentData>,
      dataFilters: DataFilter[]
    ): Filter {
      return type === DataFilterWrapperType.or
        ? this.processOrFilters(query, dataFilters)
        : this.processAndFilters(query, dataFilters);
    }
  
    private processAndFilters(
      query: Query<DocumentData>,
      dataFilters: DataFilter[]
    ): Filter {
      const filters = dataFilters.map((e) => this.getFilter(e));
      return filters.length === 1 ? filters[0] : Filter.and(...filters);
    }
  
    private processOrFilters(
      query: Query<DocumentData>,
      dataFilters: DataFilter[]
    ): Filter {
      const filters = dataFilters.map((e) => this.getFilter(e));
      return filters.length === 1 ? filters[0] : Filter.or(...filters);
    }
  
    private getFilter(dataFilter: DataFilter): Filter {
      switch (dataFilter.filterType) {
        case DataFilterType.isEqualTo:
          return Filter.where(dataFilter.fieldName, "==", dataFilter.value);
        case DataFilterType.isNotEqualTo:
          return Filter.where(dataFilter.fieldName, "!=", dataFilter.value);
        case DataFilterType.isLessThan:
          return Filter.where(dataFilter.fieldName, "<", dataFilter.value);
        case DataFilterType.isLessThanOrEqualTo:
          return Filter.where(dataFilter.fieldName, "<=", dataFilter.value);
        case DataFilterType.isGreaterThan:
          return Filter.where(dataFilter.fieldName, ">", dataFilter.value);
        case DataFilterType.isGreaterThanOrEqualTo:
          return Filter.where(dataFilter.fieldName, ">=", dataFilter.value);
        case DataFilterType.arrayContains:
          return Filter.where(
            dataFilter.fieldName,
            "array-contains",
            dataFilter.value
          );
        case DataFilterType.arrayContainsAny:
          return Filter.where(
            dataFilter.fieldName,
            "array-contains-any",
            dataFilter.value
          );
        case DataFilterType.whereIn:
          return Filter.where(dataFilter.fieldName, "in", dataFilter.value);
        case DataFilterType.whereNotIn:
          return Filter.where(dataFilter.fieldName, "not-in", dataFilter.value);
        default:
          throw new Error("Invalid filter type");
      }
    }
  
    async addData(
      data: Record<string, any>,
      docName: string,
      merge: boolean = false
    ): Promise<void> {
      const docRef = this.db.collection(this.docPath).doc(docName);
      await docRef.set(data, { merge });
    }
  
    async getData(
      filters?: DataFilterWrapper[],
      limit?: number,
      sortBy?: DataSort
    ): Promise<Record<string, any>[]> {
      let query: Query<DocumentData> = this.db.collection(this.docPath);
  
      if (filters) {
        const filter = this.processFilters(
          query,
          filters,
          DataFilterWrapperType.and
        );
        if (filter) {
          query = query.where(filter);
        }
      }
  
      if (limit) query = query.limit(limit);
      if (sortBy)
        query = query.orderBy(
          sortBy.field,
          sortBy.ascending ? "asc" : ("desc" as OrderByDirection)
        );
  
      const snapshot: QuerySnapshot = await query.get();
      return snapshot.docs.map((doc) => doc.data());
    }
  
    async getSingleDocument(
      docName: string
    ): Promise<Record<string, any> | undefined> {
      const doc = await this.db.collection(this.docPath).doc(docName).get();
      return doc.exists ? doc.data() : undefined;
    }
  
    async deleteField(docName: string, fieldName: string): Promise<void> {
      await this.db
        .collection(this.docPath)
        .doc(docName)
        .update({ [fieldName]: FieldValue.delete() });
    }
  
    getDataStream(
      callback: (data: DocumentData) => void,
      filters?: DataFilterWrapper[],
      limit?: number,
      sortBy?: DataSort
    ): () => void {
      let query: Query<DocumentData> = this.db.collection(this.docPath);
  
      if (filters) {
        const filter = this.processFilters(
          query,
          filters,
          DataFilterWrapperType.and
        );
        if (filter) {
          query = query.where(filter);
        }
      }
  
      if (limit) query = query.limit(limit);
      if (sortBy)
        query = query.orderBy(
          sortBy.field,
          sortBy.ascending ? "asc" : ("desc" as OrderByDirection)
        );
  
      const unsubscribe = query.onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            callback(change.doc.data());
          });
        },
        (error) => {
          console.error("Error getting data updates:", error);
        }
      );
  
      return unsubscribe;
    }
  
    async updateField(
      docName: string,
      update: Record<string, any>
    ): Promise<void> {
      await this.db.collection(this.docPath).doc(docName).update(update);
    }
    getSingleDocumentStream(
      docName: string,
      callback: (data: DocumentData | null) => void
    ): () => void {
      const docRef = this.db.collection(this.docPath).doc(docName);
  
      const unsubscribe = docRef.onSnapshot(
        (doc) => {
          if (doc.exists) {
            callback(doc.data() || null);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error("Error getting document updates:", error);
        }
      );
  
      return unsubscribe;
    }
  
    async deleteDocument(docName: string): Promise<void> {
      await this.db.collection(this.docPath).doc(docName).delete();
    }
  }
  