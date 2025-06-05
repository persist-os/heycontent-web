import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

// Creates a new persona and deactivates any existing ones for the user
export default httpAction(async (ctx, request) => {
  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse the request body as JSON
    const body = await request.json();
    
    // Extract required fields from the request body
    const {
      userId,
      current_name,
      current_description,
      experience_level,
      content_formats = [],
      content_tone,
      content_voice,
      content_pillars = [],
      unique_value,
      future_name,
      future_description,
      goals = [],
      desired_impact,
      primary_topics = [],
      secondary_topics = [],
      tone_descriptors = [],
      style_descriptors = [],
      audience_type,
      engagement_style = [],
    } = body;

    // Validate required fields
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create the new persona using the typed mutation
    const personaId = await ctx.runMutation(api.personas.createPersona, {
      userId,
      current_name,
      current_description,
      experience_level,
      content_formats,
      content_tone,
      content_voice,
      content_pillars,
      unique_value,
      future_name,
      future_description,
      goals,
      desired_impact,
      primary_topics,
      secondary_topics,
      tone_descriptors,
      style_descriptors,
      audience_type,
      engagement_style,
    });

    return new Response(JSON.stringify({ success: true, personaId }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating persona:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create persona",
        details: error instanceof Error ? error.message : String(error)
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
