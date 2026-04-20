import { inngest } from "./client";
import { supabaseAdmin } from "@/lib/supabase";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const resurfaceStaleIdeas = inngest.createFunction(
  { id: "resurface-stale-ideas", cron: "0 9 * * *" } as any,
  async ({ step }) => {
    const staleIdeas = await step.run("fetch-stale-ideas", async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { data, error } = await supabaseAdmin
        .from("ideas")
        .select("*")
        .lt("created_at", oneWeekAgo.toISOString())
        .limit(3);
      if (error) throw error;
      return data;
    });
    if (staleIdeas.length === 0) return { message: "No stale ideas found" };
    const suggestions = await step.run("generate-suggestions", async () => {
      const results = [];
      for (const idea of staleIdeas) {
        const { text } = await generateText({
          model: openai("gpt-4o"),
          system: "You are a proactive second brain assistant. Your goal is to help the user re-engage with their old ideas.",
          prompt: `The user had this idea a while ago: "${idea.content}". Can you give a quick, punchy suggestion or a question to help them continue or execute on this?`,
        });
        results.push({ ideaId: idea.id, suggestion: text });
      }
      return results;
    });
    return { suggestions };
  }
);
