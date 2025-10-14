Operational recommendations to reduce Disk IO immediately (no schema changes):

1) Prefer RPCs over many small REST calls (done for quiz edit via get_quiz_for_edit).
2) Avoid select *; request only needed columns.
3) Add .maybeSingle() where appropriate to prevent COUNT queries.
4) Cache client-side results where safe; avoid refetch loops on every render.
5) Reduce live polling/intervals; make them user-driven (Refresh buttons) or exponential backoff.
6) Use GRPC Realtime selectively; unsubscribe when component unmounts.

