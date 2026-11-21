// Supabase Edge Function: admin-users
// Handles privileged user operations (create, delete, role changes)
// that require the service_role key — never exposed to the browser.
//
// Deploy: supabase functions deploy admin-users
// Set secret: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify the caller is an authenticated admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonError('Missing authorization header', 401)
    }

    // Create a client with the caller's JWT to check their role
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return jsonError('Not authenticated', 401)
    }

    // Check caller is admin
    const { data: callerProfile } = await createClient(supabaseUrl, serviceRoleKey)
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return jsonError('Only administrators can manage users', 403)
    }

    // Service-role client for privileged operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'list': {
        // List all users with their profiles
        const { data: profiles, error } = await adminClient
          .from('profiles')
          .select('id, full_name, role, created_at, updated_at')
          .order('created_at', { ascending: false })

        if (error) return jsonError(error.message, 500)

        // Get emails from auth.users
        const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers()
        if (usersError) return jsonError(usersError.message, 500)

        const emailMap = new Map(users.map((u: any) => [u.id, u.email]))

        const result = (profiles ?? []).map((p: any) => ({
          id: p.id,
          fullName: p.full_name,
          email: emailMap.get(p.id) ?? '',
          role: p.role,
          createdAt: p.created_at,
        }))

        return jsonOk({ users: result })
      }

      case 'create': {
        const { email, password, fullName, role } = body
        if (!email || !password) return jsonError('Email and password are required', 400)
        if (password.length < 6) return jsonError('Password must be at least 6 characters', 400)
        if (!['admin', 'user'].includes(role ?? 'user')) return jsonError('Invalid role', 400)

        // Create the auth user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: email.trim(),
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName?.trim() ?? '' },
        })

        if (createError) return jsonError(createError.message, 400)

        // The handle_new_user trigger creates the profile with 'user' role.
        // If admin role requested, update the profile.
        if (role === 'admin' && newUser.user) {
          const { error: roleError } = await adminClient
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', newUser.user.id)

          if (roleError) return jsonError(`User created but role update failed: ${roleError.message}`, 500)
        }

        return jsonOk({ id: newUser.user?.id, email })
      }

      case 'updateRole': {
        const { userId, role } = body
        if (!userId || !role) return jsonError('userId and role are required', 400)
        if (!['admin', 'user'].includes(role)) return jsonError('Invalid role', 400)

        // Prevent demoting self
        if (userId === caller.id && role !== 'admin') {
          return jsonError('You cannot demote yourself', 400)
        }

        // If demoting, check there's at least one other admin
        if (role === 'user') {
          const { data: admins } = await adminClient
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
          const adminCount = admins?.length ?? 0
          const isTargetAdmin = admins?.some((a: any) => a.id === userId)
          if (isTargetAdmin && adminCount <= 1) {
            return jsonError('Cannot remove the last administrator', 400)
          }
        }

        const { error } = await adminClient
          .from('profiles')
          .update({ role })
          .eq('id', userId)

        if (error) return jsonError(error.message, 500)
        return jsonOk({ success: true })
      }

      case 'delete': {
        const { userId } = body
        if (!userId) return jsonError('userId is required', 400)

        // Prevent deleting self
        if (userId === caller.id) {
          return jsonError('You cannot delete your own account', 400)
        }

        // Check not last admin
        const { data: targetProfile } = await adminClient
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        if (targetProfile?.role === 'admin') {
          const { data: admins } = await adminClient
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
          if ((admins?.length ?? 0) <= 1) {
            return jsonError('Cannot delete the last administrator', 400)
          }
        }

        // Delete from auth (cascades to profiles)
        const { error } = await adminClient.auth.admin.deleteUser(userId)
        if (error) return jsonError(error.message, 500)

        return jsonOk({ success: true })
      }

      default:
        return jsonError(`Unknown action: ${action}`, 400)
    }
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Internal error', 500)
  }
})

function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}
