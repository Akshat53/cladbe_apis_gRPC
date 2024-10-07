import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import RealtimeDbDataModel from "./realtime_data_helper";
import { convertFilters } from "./filter_conversion";
import { DataHelper } from "./data_helper";


const PROTO_PATH = path.resolve(__dirname, "../../protoc/stream_service.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const streamservice = protoDescriptor.streamservice as any;

function streamData(call: grpc.ServerWritableStream<any, any>) {
  const request = call.request;
  const {
    database,
    database_id,
    collection_path,
    document_id,
    filters,
    limit,
    sort,
  } = request;

  let unsubscribe: (() => void) | undefined;
  console.log(request);
  if (database === "firestore") {
    const dataHelper = new DataHelper(collection_path, database_id);

    if (document_id) {
      unsubscribe = dataHelper.getSingleDocumentStream(document_id, (data) => {
        console.log(JSON.stringify(data));
        call.write({ data: JSON.stringify(data) });
      });
    } else {
      unsubscribe = dataHelper.getDataStream(
        (data) => {
          console.log(JSON.stringify(data));
          call.write({ data: JSON.stringify(data) });
        },
        convertFilters(filters, "firestore"),
        limit,
        sort ? { field: sort.field, ascending: sort.ascending } : undefined
      );
    }
  } else if (database === "realtime") {
    const realtimeDb = new RealtimeDbDataModel(collection_path, database_id);

    if (document_id) {
      unsubscribe = realtimeDb.getSingleDocumentStream(document_id, (data) => {
        console.log(JSON.stringify(data));
        call.write({ data: JSON.stringify(data) });
      });
    } else {
      unsubscribe = realtimeDb.getDataStream(
        (data) => {
          console.log(JSON.stringify(data));
          call.write({ data: JSON.stringify(data) });
        },
        {
          filter: convertFilters(filters, "realtime"),
          limit: limit,
        }
      );
    }
  } else {
    call.emit("error", new Error("Invalid database specified"));
    return;
  }

  call.on("cancelled", () => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
}

export function startGrpcServer(port: number) {
  const server = new grpc.Server();
  server.addService(streamservice.StreamService.service, {
    streamData: streamData,
  });
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error("Failed to bind gRPC server:", err);
        return;
      }
      console.log(`gRPC server running on port ${port}`);
      server.start();
    }
  );
}
