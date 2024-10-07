"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeDataFilterType = void 0;
const firebase_1 = __importDefault(require("../config/firebase"));
var RealtimeDataFilterType;
(function (RealtimeDataFilterType) {
    RealtimeDataFilterType[RealtimeDataFilterType["equalTo"] = 0] = "equalTo";
    RealtimeDataFilterType[RealtimeDataFilterType["startAt"] = 1] = "startAt";
    RealtimeDataFilterType[RealtimeDataFilterType["endAt"] = 2] = "endAt";
})(RealtimeDataFilterType || (exports.RealtimeDataFilterType = RealtimeDataFilterType = {}));
class RealtimeDbDataModel {
    constructor(docPath, databaseUrl) {
        this.docPath = docPath;
        this.dbRef = firebase_1.default.database(databaseUrl).ref(docPath);
    }
    processFilter(query, filters) {
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
    async addData(data, docName, merge = false) {
        if (merge) {
            await this.dbRef.child(docName).update(data);
        }
        else {
            await this.dbRef.child(docName).set(data);
        }
    }
    async deleteField(docName, fieldName) {
        await this.dbRef.child(docName).child(fieldName).remove();
    }
    async getData(options) {
        const { fromStart = false, filter, limit } = options || {};
        let query = this.dbRef;
        if (filter) {
            query = this.processFilter(query, filter);
        }
        if (limit) {
            query = fromStart ? query.limitToFirst(limit) : query.limitToLast(limit);
        }
        const snapshot = await query.once("value");
        return snapshot.val();
    }
    getDataStream(callback, options) {
        const { fromStart = false, filter, limit } = options || {};
        let query = this.dbRef;
        if (filter) {
            query = this.processFilter(query, filter);
        }
        if (limit) {
            query = fromStart ? query.limitToFirst(limit) : query.limitToLast(limit);
        }
        const onValue = (snapshot) => {
            callback(snapshot.val());
        };
        query.on("value", onValue);
        return () => {
            query.off("value", onValue);
        };
    }
    getSingleDocumentStream(docName, callback) {
        const onValue = (snapshot) => {
            callback(snapshot.val());
        };
        this.dbRef.child(docName).on("value", onValue);
        return () => {
            this.dbRef.child(docName).off("value", onValue);
        };
    }
    async updateField(update, docName) {
        await this.dbRef.child(docName).update(update);
    }
}
exports.default = RealtimeDbDataModel;
