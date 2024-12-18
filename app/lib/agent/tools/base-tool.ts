import { Tool } from "@langchain/core/tools";
import { z } from "zod";

export abstract class BaseTool extends Tool {
  protected abstract _schema: z.ZodType;

  schema = z.object({
    input: z.string().optional()
  }).transform((val) => val.input);

  protected validateInput(input: string): any {
    try {
      return this._schema.parse(JSON.parse(input));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid input: ${error.message}`);
      }
      throw new Error('Invalid input');
    }
  }
} 