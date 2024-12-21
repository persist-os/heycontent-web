import { BaseAgent, AgentContext } from "./base-agent";
import { Message } from "@/types/conversation";
import { RAGSystem } from "../rag";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

export class ChatAgent extends BaseAgent {
  protected model: ChatOpenAI;

  constructor(rag: RAGSystem) {
    super(rag, 'chat');
    this.model = new ChatOpenAI({
      modelName: "gpt-4-1106-preview",
      temperature: 0.7,
    });
  }

  protected systemPrompt = `You are a helpful AI assistant focused on providing clear, accurate, and contextually relevant responses.

Core Rules:
1. Focus on user context:
   - Consider previous messages
   - Maintain conversation flow
   - Use relevant insights
   - Stay on topic

2. Enable cross-agent awareness:
   - Use insights from other agents
   - Consider platform context
   - Link to relevant data
   - Maintain consistency

3. Provide actionable responses:
   - Give clear explanations
   - Suggest next steps
   - Link to relevant tools
   - Stay helpful and focused`;

  async process(input: string, context: AgentContext) {
    try {
      // Get cross-agent context
      const crossAgentContext = await this.getCrossAgentContext(input, context);

      // Get user's persona
      const userPersona = await this.rag.getUserPersona(context.userId);

      // Convert previous messages if they exist
      const previousMessages = context.previousMessages 
        ? this.convertMessagesToBaseMessages(context.previousMessages)
        : [];

      // Create messages for the model
      const messages = [
        new SystemMessage(this.systemPrompt),
        ...previousMessages,
        new HumanMessage({
          content: input,
          additional_kwargs: {
            userPersona,
            crossAgentContext
          }
        })
      ];

      // Generate response
      const response = await this.model.invoke(messages);

      if (!(response instanceof AIMessage)) {
        throw new Error("Unexpected response type from model");
      }

      // Store the conversation
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: this.convertMessageContentToString(response.content),
        timestamp: new Date().toISOString()
      };

      await this.storeResult(
        JSON.stringify(newMessage),
        {
          type: "conversation_history",
          user_id: context.userId,
          timestamp: new Date().toISOString(),
          conversationId: context.conversationId
        }
      );

      // Update chat screen data
      await this.updateScreenData(context.userId, {
        lastMessage: this.convertMessageContentToString(response.content),
        timestamp: new Date().toISOString(),
        conversationId: context.conversationId
      });

      return {
        output: response.content
      };
    } catch (error) {
      console.error("ChatAgent error:", error);
      return {
        output: null,
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
} 