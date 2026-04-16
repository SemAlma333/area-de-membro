import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateClientBody {
  email?: string;
  password?: string;
  displayName?: string | null;
  phone?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Configuração da função incompleta." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    console.log("Recebendo requisição. Auth Header presente:", !!authHeader);

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      console.error("Erro ao validar usuário:", authError?.message);
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Usuário autenticado:", authData.user.email);

    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    console.log("Papel do usuário no banco:", roleData?.role);

    if (roleError || roleData?.role !== "admin") {
      console.error("Acesso negado: Usuário não é admin.");
      return new Response(JSON.stringify({ error: "Apenas administradores podem cadastrar alunos." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as CreateClientBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const displayName = body.displayName?.trim() || null;
    const phone = body.phone?.trim() || null;

    if (!email || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: "Dados inválidos. Informe e-mail e senha com mínimo de 6 caracteres." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: displayName ? { display_name: displayName } : undefined,
    });

    if (createError || !createdUser.user) {
      return new Response(JSON.stringify({ error: createError?.message || "Não foi possível criar o usuário." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const createdUserId = createdUser.user.id;

    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", createdUserId)
      .maybeSingle();

    if (roleRow?.id) {
      await adminClient.from("user_roles").update({ role: "member" }).eq("id", roleRow.id);
    } else {
      await adminClient.from("user_roles").insert({ user_id: createdUserId, role: "member" });
    }

    const { data: profileRow } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", createdUserId)
      .maybeSingle();

    if (profileRow?.id) {
      await adminClient
        .from("profiles")
        .update({ display_name: displayName, phone: phone, is_active: true })
        .eq("id", profileRow.id);
    } else {
      await adminClient.from("profiles").insert({
        user_id: createdUserId,
        display_name: displayName,
        phone: phone,
        is_active: true,
      });
    }

    return new Response(JSON.stringify({ ok: true, userId: createdUserId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
