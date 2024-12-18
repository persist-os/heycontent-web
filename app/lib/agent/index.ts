import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { SocialMediaTool } from "./tools/social-media";
import { ContentAnalysisTool } from "./tools/content-analysis";
import { PartnershipTool } from "./tools/partnerships";
import { SmartNotesTool } from "./tools/smart-notes";
import { RAGSystem } from "../rag";
import { GmailService } from "../services/gmail";
import { SocialMediaService } from "../services/social-media";
import { auth } from "../../auth";
import { prisma } from "@/lib/prisma";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Tool } from "@langchain/core/tools";
import { ZodObject } from "zod";

type BaseTool = SocialMediaTool | ContentAnalysisTool | PartnershipTool | SmartNotesTool;

const getValidAccessToken = (token: string | null): string => {
  if (!token) throw new Error("No access token available");
  return token;
};

export class PlatformAgent {
  private model: ChatOpenAI;
  private executor: AgentExecutor | null = null;
  private rag: RAGSystem;
  private socialService: SocialMediaService;
  private gmailService?: GmailService;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0.7,
    });
    this.rag = new RAGSystem();
    this.socialService = new SocialMediaService();
  }

  async initialize(context?: { userId?: string }) {
    if (context?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: context.userId },
        include: { accounts: true }
      });

      const gmailAccount = user?.accounts.find(acc => acc.provider === 'google');
      if (gmailAccount) {
        this.gmailService = new GmailService(getValidAccessToken(gmailAccount.access_token));
      }
    }

    const tools: BaseTool[] = [
      new SocialMediaTool(this.socialService, this.rag),
      new ContentAnalysisTool(),
      ...(this.gmailService ? [new PartnershipTool()] : []),
      new SmartNotesTool(this.rag)
    ];

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful AI assistant."],
      ["human", "{input}"]
    ]);

    const agent = await createOpenAIFunctionsAgent({
      llm: this.model,
      tools: tools as Tool[],
      prompt,
    });

    this.executor = AgentExecutor.fromAgentAndTools({
      agent,
      tools: tools as Tool[],
      verbose: true,
    });
  }

  async process(query: string, context?: any) {
    if (!this.executor) await this.initialize(context);

    // Get relevant context from RAG
    const relevantDocs = await this.rag.search(query, {
      type: 'smart_note',
      userId: context?.userId
    });

    const enrichedContext = {
      ...context,
      relevantDocuments: relevantDocs
    };

    return await this.executor!.call({ 
      input: query, 
      context: enrichedContext 
    });
  }
} 