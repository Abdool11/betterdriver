# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\full-flow.spec.ts >> Full GFA → BD driver activation flow >> Step 4 — GFA admin authenticates
- Location: e2e\full-flow.spec.ts:94:7

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED ::1:3001
Call log:
  - → POST http://localhost:3001/api/admin/auth/login
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7778.96 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 70

```