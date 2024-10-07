import { DataFilter, DataFilterType, DataFilterWrapper, DataFilterWrapperType } from "./data_helper";
import { RealtimeDataFilter, RealtimeDataFilterType } from "./realtime_data_helper";


export function convertFilters(filters: any[], database: 'firestore' | 'realtime'): any {
  if (database === 'firestore') {
    return convertFirestoreFilters(filters);
  } else {
    return convertRealtimeFilters(filters);
  }
}

function convertFirestoreFilters(filters: any[]): (DataFilter | DataFilterWrapper)[] {
  return filters.map(filter => {
    if (filter.filters) {
      // This is a wrapper filter (OR/AND)
      return {
        filterWrapperType: filter.operation === 'or' ? DataFilterWrapperType.or : DataFilterWrapperType.and,
        filters: convertFirestoreFilters(filter.filters)
      } as DataFilterWrapper;
    } else {
      // This is a regular filter
      return {
        fieldName: filter.field,
        filterType: mapToFirestoreFilterType(filter.operation),
        value: filter.value
      } as DataFilter;
    }
  });
}

function mapToFirestoreFilterType(operation: string): DataFilterType {
  switch (operation) {
    case 'equalTo': return DataFilterType.isEqualTo;
    case 'notEqualTo': return DataFilterType.isNotEqualTo;
    case 'lessThan': return DataFilterType.isLessThan;
    case 'lessThanOrEqualTo': return DataFilterType.isLessThanOrEqualTo;
    case 'greaterThan': return DataFilterType.isGreaterThan;
    case 'greaterThanOrEqualTo': return DataFilterType.isGreaterThanOrEqualTo;
    case 'arrayContains': return DataFilterType.arrayContains;
    case 'arrayContainsAny': return DataFilterType.arrayContainsAny;
    case 'in': return DataFilterType.whereIn;
    case 'notIn': return DataFilterType.whereNotIn;
    default: throw new Error(`Unsupported Firestore filter operation: ${operation}`);
  }
}

function convertRealtimeFilters(filters: any[]): RealtimeDataFilter[] {
  return filters.map(filter => ({
    field: filter.field,
    filter: mapToRealtimeFilterType(filter.operation),
    value: filter.value
  }));
}

function mapToRealtimeFilterType(operation: string): RealtimeDataFilterType {
  switch (operation) {
    case 'equalTo': return RealtimeDataFilterType.equalTo;
    case 'startAt': return RealtimeDataFilterType.startAt;
    case 'endAt': return RealtimeDataFilterType.endAt;
    default: throw new Error(`Unsupported Realtime Database filter operation: ${operation}`);
  }
}