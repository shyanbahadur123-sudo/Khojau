-- 0016: pin search_path on trigger helpers (advisor: function_search_path_mutable).
--
-- These are plain SECURITY INVOKER plpgsql trigger functions whose
-- unqualified names today resolve via the caller's search_path. Pinning
-- search_path = public preserves that resolution exactly while closing the
-- schema-hijack vector. Non-destructive: no tables, policies, or data touched.
ALTER FUNCTION public.prevent_provider_moderation_escalation() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.enforce_request_status_flow() SET search_path = public;
