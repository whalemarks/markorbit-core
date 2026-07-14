# Core Document Service governed artifact foundation

Document Service is the sixth dependency-first Service-owned behavior batch selected from the locked Book 02 MVP gap baseline.

## Authority

- Repository: whalemarks/markorbit-publication
- Commit: 3349ecb8955021a8714d023348f8b24f941eb98f
- Primary specifications: Document Domain, Object and Service.

## Dependency rationale

Document is the governed artifact layer between raw source files and professional execution. Evidence registers proof purpose after source artifacts exist, while Matter consumes Document and Evidence as business-execution context. The selected implementation sequence is therefore Classification, Document, Evidence, then Matter.

## Governed foundation operations

- createDocument
- getDocument
- listDocuments
- validateDocumentReference
- linkDocumentFile
- requireDocumentReview
- reviewDocument
- changeDocumentStatus

## Artifact and review invariants

Creation starts as Draft and Unreviewed. A Document owns governed artifact metadata and a public reference; a file reference is linked explicitly and is not itself a Document. Professional approval requires completed human review. AI-reviewed drafts are never treated as approved-for-use artifacts. Document validation reports review, confidentiality, archive and rejection boundaries without converting the Document into Evidence.

## Derived boundary

The independently derived target is 38 Must Build requirements meeting required depth, 3 partial evidence, 51 validated skeleton only, 5 boundary scaffold only and 18 semantic overlap only. Acceptance remains 11 of 19 because 12 Must Build Services still lack executable owned behavior.

## Boundary

This task does not implement file storage, OCR, e-signature, template generation, automatic Evidence conversion, API routes, Workflow preview/apply, persistence, Event bus runtime or production connectors.
