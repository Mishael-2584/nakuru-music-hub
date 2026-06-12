import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TeacherDocumentInput {
  doc_type: string;
  file_path: string;
  file_name?: string;
}

interface TeacherApplicationInput {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  bio?: string;
  experience?: string;
  category: string;
  subjects: string[];
  cv_file_path?: string;
  documents?: TeacherDocumentInput[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as TeacherApplicationInput;
    const {
      id,
      name,
      email,
      phone,
      password,
      bio,
      experience,
      category,
      subjects,
      cv_file_path,
      documents = [],
    } = body;

    if (
      !id ||
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !password ||
      !category ||
      !Array.isArray(subjects) ||
      subjects.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required application fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: appError } = await supabase.from("pending_teachers").insert({
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      bio: bio?.trim() || null,
      experience: experience?.trim() || null,
      category,
      subjects,
      status: "pending",
      cv_file_path: cv_file_path || null,
    });

    if (appError) {
      console.error("pending_teachers insert failed:", appError);
      return new Response(
        JSON.stringify({
          error: appError.message,
          code: appError.code,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (documents.length > 0) {
      const rows = documents.map((doc) => ({
        pending_teacher_id: id,
        doc_type: doc.doc_type,
        file_path: doc.file_path,
        file_name: doc.file_name || null,
      }));

      const { error: docError } = await supabase
        .from("pending_teacher_documents")
        .insert(rows);

      if (docError) {
        console.error("pending_teacher_documents insert failed:", docError);
        await supabase.from("pending_teachers").delete().eq("id", id);
        return new Response(
          JSON.stringify({
            error: docError.message,
            code: docError.code,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-teacher-application error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
