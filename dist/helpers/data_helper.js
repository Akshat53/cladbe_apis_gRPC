"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataHelper = exports.DataFilterWrapperType = exports.DataFilterType = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../config/firebase");
var DataFilterType;
(function (DataFilterType) {
    DataFilterType[DataFilterType["isEqualTo"] = 0] = "isEqualTo";
    DataFilterType[DataFilterType["isNotEqualTo"] = 1] = "isNotEqualTo";
    DataFilterType[DataFilterType["isLessThan"] = 2] = "isLessThan";
    DataFilterType[DataFilterType["isLessThanOrEqualTo"] = 3] = "isLessThanOrEqualTo";
    DataFilterType[DataFilterType["isGreaterThan"] = 4] = "isGreaterThan";
    DataFilterType[DataFilterType["isGreaterThanOrEqualTo"] = 5] = "isGreaterThanOrEqualTo";
    DataFilterType[DataFilterType["arrayContains"] = 6] = "arrayContains";
    DataFilterType[DataFilterType["arrayContainsAny"] = 7] = "arrayContainsAny";
    DataFilterType[DataFilterType["whereIn"] = 8] = "whereIn";
    DataFilterType[DataFilterType["whereNotIn"] = 9] = "whereNotIn";
})(DataFilterType || (exports.DataFilterType = DataFilterType = {}));
var DataFilterWrapperType;
(function (DataFilterWrapperType) {
    DataFilterWrapperType[DataFilterWrapperType["or"] = 0] = "or";
    DataFilterWrapperType[DataFilterWrapperType["and"] = 1] = "and";
})(DataFilterWrapperType || (exports.DataFilterWrapperType = DataFilterWrapperType = {}));
// Type guard for DataFilterWrapper
function isDataFilterWrapper(obj) {
    return (obj.filters !== undefined &&
        obj.filterWrapperType !== undefined);
}
// Type guard for DataFilter
function isDataFilter(obj) {
    return (obj.fieldName !== undefined &&
        obj.filterType !== undefined);
}
class DataHelper {
    constructor(docPath, databaseName) {
        this.docPath = docPath;
        this.db = (0, firebase_1.getFirestoreRef)(databaseName);
    }
    processFilters(query, dataFilters, type) {
        const filters = [];
        if (dataFilters.every(isDataFilterWrapper)) {
            for (const e of dataFilters) {
                const filter = this.processFilters(query, e.filters, e.filterWrapperType);
                if (filter) {
                    filters.push(filter);
                }
            }
        }
        else if (dataFilters.every(isDataFilter)) {
            filters.push(this.processFilterType(type, query, dataFilters));
        }
        return filters.length === 0
            ? null
            : filters.length === 1
                ? filters[0]
                : firestore_1.Filter.and(...filters);
    }
    processFilterType(type, query, dataFilters) {
        return type === DataFilterWrapperType.or
            ? this.processOrFilters(query, dataFilters)
            : this.processAndFilters(query, dataFilters);
    }
    processAndFilters(query, dataFilters) {
        const filters = dataFilters.map((e) => this.getFilter(e));
        return filters.length === 1 ? filters[0] : firestore_1.Filter.and(...filters);
    }
    processOrFilters(query, dataFilters) {
        const filters = dataFilters.map((e) => this.getFilter(e));
        return filters.length === 1 ? filters[0] : firestore_1.Filter.or(...filters);
    }
    getFilter(dataFilter) {
        switch (dataFilter.filterType) {
            case DataFilterType.isEqualTo:
                return firestore_1.Filter.where(dataFilter.fieldName, "==", dataFilter.value);
            case DataFilterType.isNotEqualTo:
                return firestore_1.Filter.where(dataFilter.fieldName, "!=", dataFilter.value);
            case DataFilterType.isLessThan:
                return firestore_1.Filter.where(dataFilter.fieldName, "<", dataFilter.value);
            case DataFilterType.isLessThanOrEqualTo:
                return firestore_1.Filter.where(dataFilter.fieldName, "<=", dataFilter.value);
            case DataFilterType.isGreaterThan:
                return firestore_1.Filter.where(dataFilter.fieldName, ">", dataFilter.value);
            case DataFilterType.isGreaterThanOrEqualTo:
                return firestore_1.Filter.where(dataFilter.fieldName, ">=", dataFilter.value);
            case DataFilterType.arrayContains:
                return firestore_1.Filter.where(dataFilter.fieldName, "array-contains", dataFilter.value);
            case DataFilterType.arrayContainsAny:
                return firestore_1.Filter.where(dataFilter.fieldName, "array-contains-any", dataFilter.value);
            case DataFilterType.whereIn:
                return firestore_1.Filter.where(dataFilter.fieldName, "in", dataFilter.value);
            case DataFilterType.whereNotIn:
                return firestore_1.Filter.where(dataFilter.fieldName, "not-in", dataFilter.value);
            default:
                throw new Error("Invalid filter type");
        }
    }
    async addData(data, docName, merge = false) {
        const docRef = this.db.collection(this.docPath).doc(docName);
        await docRef.set(data, { merge });
    }
    async getData(filters, limit, sortBy) {
        let query = this.db.collection(this.docPath);
        if (filters) {
            const filter = this.processFilters(query, filters, DataFilterWrapperType.and);
            if (filter) {
                query = query.where(filter);
            }
        }
        if (limit)
            query = query.limit(limit);
        if (sortBy)
            query = query.orderBy(sortBy.field, sortBy.ascending ? "asc" : "desc");
        const snapshot = await query.get();
        return snapshot.docs.map((doc) => doc.data());
    }
    async getSingleDocument(docName) {
        const doc = await this.db.collection(this.docPath).doc(docName).get();
        return doc.exists ? doc.data() : undefined;
    }
    async deleteField(docName, fieldName) {
        await this.db
            .collection(this.docPath)
            .doc(docName)
            .update({ [fieldName]: firestore_1.FieldValue.delete() });
    }
    getDataStream(callback, filters, limit, sortBy) {
        let query = this.db.collection(this.docPath);
        if (filters) {
            const filter = this.processFilters(query, filters, DataFilterWrapperType.and);
            if (filter) {
                query = query.where(filter);
            }
        }
        if (limit)
            query = query.limit(limit);
        if (sortBy)
            query = query.orderBy(sortBy.field, sortBy.ascending ? "asc" : "desc");
        const unsubscribe = query.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                callback(change.doc.data());
            });
        }, (error) => {
            console.error("Error getting data updates:", error);
        });
        return unsubscribe;
    }
    async updateField(docName, update) {
        await this.db.collection(this.docPath).doc(docName).update(update);
    }
    getSingleDocumentStream(docName, callback) {
        const docRef = this.db.collection(this.docPath).doc(docName);
        const unsubscribe = docRef.onSnapshot((doc) => {
            if (doc.exists) {
                callback(doc.data() || null);
            }
            else {
                callback(null);
            }
        }, (error) => {
            console.error("Error getting document updates:", error);
        });
        return unsubscribe;
    }
    async deleteDocument(docName) {
        await this.db.collection(this.docPath).doc(docName).delete();
    }
}
exports.DataHelper = DataHelper;
