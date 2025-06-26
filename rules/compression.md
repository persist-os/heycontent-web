# PRD: Convex Data Compression with MessagePack + Brotli

## Compression Threshold

* **Only compress JSON payloads larger than 8 KB (8192 bytes when stringified)**
* Payloads ≤ 8 KB must be stored uncompressed to avoid unnecessary overhead

---

## Overview

This document defines the plan for compressing Convex document fields using MessagePack + Brotli, with strict read/write logic on both the FastAPI backend and the frontend. Compression improves storage efficiency and reduces network load. The frontend reads directly from Convex and must always handle decompression.

---

## Compression Format

* **Serialization**: MessagePack (via `msgpack`)
* **Compression**: Brotli (level 4–6)
* **Encoding**: base64-encoded string for Convex compatibility

---

## Data Schema

Compressed fields must use the following format:

```json
{
  "compressedData": "<base64-encoded string>",
  "isCompressed": true
}
```

---

## Responsibilities

### FastAPI Backend

* Compress all JSON payloads > 8 KB before writing to Convex
* Base64-encode compressed output
* Write only compressed data under clearly named fields (`compressedData`, `compressedResults`, etc.)
* Add `isCompressed: true` flag to all compressed records
* On read, detect and decompress `compressedData`
* Fallback to uncompressed fields only during migration phase

### Frontend (Next.js client)

* Always check for and decode `compressedData` if present
* Decompress using Brotli and MessagePack in browser
* Fallback to `rawData` only during migration phase
* Use shared decompression utility across all components and routes

---

## Implementation Phases

### Phase 1: Add Compression in Parallel

* Backend writes both `rawData` and `compressedData`
* Frontend continues using `rawData`
* Backend and frontend implement decompression logic
* Add utility wrappers for encoding and decoding
* Skip compression for any payloads ≤ 8 KB

### Phase 2: Frontend Switch to Compressed Reads

* Frontend reads `compressedData` as default
* Backend stops writing `rawData` for new records
* Backfill old records with compressed fields
* Remove unused raw data from Convex documents

### Phase 3: Enforce Compressed Schema

* All Convex documents store only compressed payloads if payload > 8 KB
* All reads (backend and frontend) assume `compressedData` is present
* Remove fallback logic

---

## Requirements

* Only compress if stringified JSON exceeds 8192 bytes
* Do not store both `rawData` and `compressedData` long-term
* Use consistent field names and encoding structure across all tables
* Compression must be lossless and fully reversible
* Compressed payloads must not exceed Convex’s 400 KB document limit (after base64 encoding)
* Do not compress already compressed data
* Do not perform compression in Convex functions

---

## Success Criteria

* Compressed fields are at least 50–90% smaller than raw JSON
* Backend and frontend fully interoperate with compressed payloads
* No frontend screen breaks due to decompression failure
* Convex storage usage drops significantly for high-volume tables
* No major increase in frontend bundle size or CPU load