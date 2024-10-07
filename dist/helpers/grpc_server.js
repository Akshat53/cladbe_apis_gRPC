"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGrpcServer = startGrpcServer;
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path_1 = __importDefault(require("path"));
const realtime_data_helper_1 = __importDefault(require("./realtime_data_helper"));
const filter_conversion_1 = require("./filter_conversion");
const data_helper_1 = require("./data_helper");
const PROTO_PATH = path_1.default.resolve(__dirname, "../../protoc/stream_service.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const streamservice = protoDescriptor.streamservice;
function streamData(call) {
    const request = call.request;
    const { database, database_id, collection_path, document_id, filters, limit, sort, } = request;
    let unsubscribe;
    console.log(request);
    if (database === "firestore") {
        const dataHelper = new data_helper_1.DataHelper(collection_path, database_id);
        if (document_id) {
            unsubscribe = dataHelper.getSingleDocumentStream(document_id, (data) => {
                console.log(JSON.stringify(data));
                call.write({ data: JSON.stringify(data) });
            });
        }
        else {
            unsubscribe = dataHelper.getDataStream((data) => {
                console.log(JSON.stringify(data));
                call.write({ data: JSON.stringify(data) });
            }, (0, filter_conversion_1.convertFilters)(filters, "firestore"), limit, sort ? { field: sort.field, ascending: sort.ascending } : undefined);
        }
    }
    else if (database === "realtime") {
        const realtimeDb = new realtime_data_helper_1.default(collection_path, database_id);
        if (document_id) {
            unsubscribe = realtimeDb.getSingleDocumentStream(document_id, (data) => {
                console.log(JSON.stringify(data));
                call.write({ data: JSON.stringify(data) });
            });
        }
        else {
            unsubscribe = realtimeDb.getDataStream((data) => {
                console.log(JSON.stringify(data));
                call.write({ data: JSON.stringify(data) });
            }, {
                filter: (0, filter_conversion_1.convertFilters)(filters, "realtime"),
                limit: limit,
            });
        }
    }
    else {
        call.emit("error", new Error("Invalid database specified"));
        return;
    }
    call.on("cancelled", () => {
        if (unsubscribe) {
            unsubscribe();
        }
    });
}
function startGrpcServer(port) {
    const server = new grpc.Server();
    server.addService(streamservice.StreamService.service, {
        streamData: streamData,
    });
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error("Failed to bind gRPC server:", err);
            return;
        }
        console.log(`gRPC server running on port ${port}`);
        server.start();
    });
}
