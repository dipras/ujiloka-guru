# Teacher MVP Verification

Verified on 2026-06-17:

- `npm run build` passes.
- `npm run lint` passes.
- Exam schema uses short keys required by `mvp.md`.
- QR chunk contract is `{ "i": "...", "n": 0, "t": 5, "v": "..." }`.
- `v` is capped at 500 characters by `QR_CHUNK_VALUE_LIMIT`.
- Exam QR payload stores answer key in protected `ak`, not plaintext option IDs.
- Teacher UI supports metadata, objective question editing, QR generation, print, slideshow, result collection, objective scoring, duplicate marking, and CSV export.

Manual demo path:

1. Fill exam metadata and objective questions.
2. Confirm QR count and payload size update.
3. Print QR or use slideshow mode.
4. Paste or scan a result payload/chunk.
5. Confirm web scoring ignores any student-side score.
6. Export CSV and verify required columns.
