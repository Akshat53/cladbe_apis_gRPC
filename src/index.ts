import { startGrpcServer } from "./helpers/grpc_server";
const GRPC_PORT = process.env.GRPC_PORT || 50051;
startGrpcServer(Number(GRPC_PORT));
