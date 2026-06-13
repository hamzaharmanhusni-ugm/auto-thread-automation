-- Per-workspace MCP bearer token, managed from the app UI (Pengaturan) when the
-- MCP_AUTH_TOKEN environment variable is not set. An admin can auto-generate it
-- or type one in. See app/(app)/pengaturan + app/api/[transport]/route.ts.

alter table public.workspace_settings
  add column if not exists mcp_auth_token text;

comment on column public.workspace_settings.mcp_auth_token is
  'Per-workspace MCP bearer token, set/generated from the app UI when MCP_AUTH_TOKEN env is not set.';
