#!/bin/bash
# Tạo thêm database cho Discussion Service
# PostgreSQL Docker entrypoint chạy file này lần đầu (khi volume trống)
# ON_ERROR_STOP=0: nếu DB đã tồn tại, bỏ qua lỗi và tiếp tục
psql -v ON_ERROR_STOP=0 -U "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE discussion_db;
EOSQL
