# CRITICAL SECURITY: RLS POLICIES REQUIRED

⚠️ **EMERGENCY SECURITY NOTICE** ⚠️

## CRITICAL VULNERABILITIES IDENTIFIED

The ASR-GoT application currently has **CRITICAL AUTHORIZATION BYPASS VULNERABILITIES** in the database layer. Users can access other users' data by manipulating session IDs.

## IMMEDIATE ACTION REQUIRED

**A database administrator must manually apply these Row Level Security (RLS) policies through the Supabase dashboard or SQL console:**

### 1. ENABLE RLS ON ALL TABLES

```sql
ALTER TABLE query_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### 2. DROP ANY EXISTING PERMISSIVE POLICIES

```sql
-- Drop any existing policies that might be too permissive
DROP POLICY IF EXISTS "Enable read access for all users" ON query_sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON query_sessions;
DROP POLICY IF EXISTS "Enable update for users based on email" ON query_sessions;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON query_sessions;
-- Repeat for all tables...
```

### 3. CREATE STRICT USER-BASED POLICIES

#### QUERY_SESSIONS (Critical - Users can only access their own sessions)
```sql
CREATE POLICY "query_sessions_select" ON query_sessions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "query_sessions_insert" ON query_sessions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "query_sessions_update" ON query_sessions 
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "query_sessions_delete" ON query_sessions 
FOR DELETE USING (auth.uid() = user_id);
```

#### QUERY_FIGURES (Access only through session ownership)
```sql
CREATE POLICY "query_figures_select" ON query_figures 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = query_figures.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "query_figures_insert" ON query_figures 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = query_figures.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "query_figures_update" ON query_figures 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = query_figures.session_id 
    AND query_sessions.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = query_figures.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "query_figures_delete" ON query_figures 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = query_figures.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);
```

#### QUERY_TABLES (Access only through session ownership)
```sql
CREATE POLICY "query_tables_select" ON query_tables 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = query_tables.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "query_tables_insert" ON query_tables 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = query_tables.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "query_tables_update" ON query_tables 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = query_tables.session_id 
    AND query_sessions.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = query_tables.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "query_tables_delete" ON query_tables 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = query_tables.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);
```

#### RESEARCH_SESSIONS (Users can only access their own sessions)
```sql
CREATE POLICY "research_sessions_select" ON research_sessions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "research_sessions_insert" ON research_sessions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "research_sessions_update" ON research_sessions 
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "research_sessions_delete" ON research_sessions 
FOR DELETE USING (auth.uid() = user_id);
```

#### GRAPH_DATA (Access only through session ownership)
```sql
CREATE POLICY "graph_data_select" ON graph_data 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = graph_data.session_id 
    AND research_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "graph_data_insert" ON graph_data 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = graph_data.session_id 
    AND research_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "graph_data_update" ON graph_data 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = graph_data.session_id 
    AND research_sessions.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = graph_data.session_id 
    AND research_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "graph_data_delete" ON graph_data 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = graph_data.session_id 
    AND research_sessions.user_id = auth.uid()
  )
);
```

#### STAGE_EXECUTIONS (Access only through session ownership)
```sql
CREATE POLICY "stage_executions_select" ON stage_executions 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = stage_executions.session_id 
    AND research_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "stage_executions_insert" ON stage_executions 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = stage_executions.session_id 
    AND research_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "stage_executions_update" ON stage_executions 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = stage_executions.session_id 
    AND research_sessions.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = stage_executions.session_id 
    AND research_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "stage_executions_delete" ON stage_executions 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = stage_executions.session_id 
    AND research_sessions.user_id = auth.uid()
  )
);
```

#### PROFILES (Users can only access their own profile)
```sql
CREATE POLICY "profiles_select" ON profiles 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update" ON profiles 
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete" ON profiles 
FOR DELETE USING (auth.uid() = user_id);
```

## VERIFICATION STEPS

After applying these policies, verify they work by:

1. **Test unauthenticated access** - Should be blocked:
```sql
-- This should return no results when not authenticated
SELECT * FROM query_sessions LIMIT 1;
```

2. **Test cross-user access** - Should be blocked:
```sql
-- When authenticated as User A, this should not return User B's sessions
SELECT * FROM query_sessions WHERE user_id != auth.uid() LIMIT 1;
```

3. **Test authorized access** - Should work:
```sql
-- When authenticated, this should return only your sessions
SELECT * FROM query_sessions WHERE user_id = auth.uid() LIMIT 5;
```

## IMPACT ASSESSMENT

**Without these policies:**
- ❌ Any user can access any other user's research sessions
- ❌ Any user can export any other user's data  
- ❌ Any user can view sensitive research information
- ❌ Complete authorization bypass vulnerability

**With these policies:**
- ✅ Users can only access their own data
- ✅ Session-related data is properly isolated
- ✅ Export functions are secure
- ✅ Authorization is enforced at database level

## STATUS

- ✅ **Application-level fixes**: COMPLETED
  - Fixed HistoryManager.ts authorization bypass
  - Added AuthorizationService for proper user verification
  - Created SecureDataService for safe database access
  
- ⚠️ **Database-level policies**: PENDING MANUAL APPLICATION
  - RLS policies must be applied manually by database admin
  - Cannot be applied through application code (no exec_sql function)

## URGENCY: CRITICAL

This is a **CRITICAL SECURITY VULNERABILITY** that allows complete data access bypass. These policies must be applied immediately to prevent unauthorized access to user data.

The application code has been fixed, but database-level enforcement is still required for complete security.