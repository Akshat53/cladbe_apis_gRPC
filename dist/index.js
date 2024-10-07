"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grpc_server_1 = require("./helpers/grpc_server");
const GRPC_PORT = process.env.GRPC_PORT || 50051;
(0, grpc_server_1.startGrpcServer)(Number(GRPC_PORT));
