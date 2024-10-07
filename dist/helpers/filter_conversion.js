"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFilters = convertFilters;
const data_helper_1 = require("./data_helper");
const realtime_data_helper_1 = require("./realtime_data_helper");
function convertFilters(filters, database) {
    if (database === 'firestore') {
        return convertFirestoreFilters(filters);
    }
    else {
        return convertRealtimeFilters(filters);
    }
}
function convertFirestoreFilters(filters) {
    return filters.map(filter => {
        if (filter.filters) {
            // This is a wrapper filter (OR/AND)
            return {
                filterWrapperType: filter.operation === 'or' ? data_helper_1.DataFilterWrapperType.or : data_helper_1.DataFilterWrapperType.and,
                filters: convertFirestoreFilters(filter.filters)
            };
        }
        else {
            // This is a regular filter
            return {
                fieldName: filter.field,
                filterType: mapToFirestoreFilterType(filter.operation),
                value: filter.value
            };
        }
    });
}
function mapToFirestoreFilterType(operation) {
    switch (operation) {
        case 'equalTo': return data_helper_1.DataFilterType.isEqualTo;
        case 'notEqualTo': return data_helper_1.DataFilterType.isNotEqualTo;
        case 'lessThan': return data_helper_1.DataFilterType.isLessThan;
        case 'lessThanOrEqualTo': return data_helper_1.DataFilterType.isLessThanOrEqualTo;
        case 'greaterThan': return data_helper_1.DataFilterType.isGreaterThan;
        case 'greaterThanOrEqualTo': return data_helper_1.DataFilterType.isGreaterThanOrEqualTo;
        case 'arrayContains': return data_helper_1.DataFilterType.arrayContains;
        case 'arrayContainsAny': return data_helper_1.DataFilterType.arrayContainsAny;
        case 'in': return data_helper_1.DataFilterType.whereIn;
        case 'notIn': return data_helper_1.DataFilterType.whereNotIn;
        default: throw new Error(`Unsupported Firestore filter operation: ${operation}`);
    }
}
function convertRealtimeFilters(filters) {
    return filters.map(filter => ({
        field: filter.field,
        filter: mapToRealtimeFilterType(filter.operation),
        value: filter.value
    }));
}
function mapToRealtimeFilterType(operation) {
    switch (operation) {
        case 'equalTo': return realtime_data_helper_1.RealtimeDataFilterType.equalTo;
        case 'startAt': return realtime_data_helper_1.RealtimeDataFilterType.startAt;
        case 'endAt': return realtime_data_helper_1.RealtimeDataFilterType.endAt;
        default: throw new Error(`Unsupported Realtime Database filter operation: ${operation}`);
    }
}
