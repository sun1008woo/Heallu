import OpenAI from "openai";
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

let client: OpenAI | null = null;

const ensureArray = (value: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(value) ? value : [value];

const getClient = () => {
  if (!ENV.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!client) {
    client = new OpenAI({ apiKey: ENV.openAiApiKey });
  }

  return client;
};

const normalizeRole = (role: Role): "system" | "user" | "assistant" => {
  if (role === "system" || role === "user" || role === "assistant") {
    return role;
  }

  return "assistant";
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; name: string; schema: Record<string, unknown>; strict?: boolean }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }

    if (explicitFormat.type === "json_schema") {
      return {
        type: "json_schema",
        name: explicitFormat.json_schema.name,
        schema: explicitFormat.json_schema.schema,
        ...(typeof explicitFormat.json_schema.strict === "boolean"
          ? { strict: explicitFormat.json_schema.strict }
          : {}),
      };
    }

    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    name: schema.name,
    schema: schema.schema,
    ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
  };
};

const normalizeInputContent = (
  content: MessageContent | MessageContent[],
): Array<
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail?: "auto" | "low" | "high" }
  | { type: "input_file"; file_url: string; filename?: string }
> =>
  ensureArray(content).map((part) => {
    if (typeof part === "string") {
      return { type: "input_text", text: part };
    }

    if (part.type === "text") {
      return { type: "input_text", text: part.text };
    }

    if (part.type === "image_url") {
      return {
        type: "input_image",
        image_url: part.image_url.url,
        ...(part.image_url.detail ? { detail: part.image_url.detail } : {}),
      };
    }

    if (part.type === "file_url") {
      const filename = part.file_url.url.split("/").pop();
      return {
        type: "input_file",
        file_url: part.file_url.url,
        ...(filename ? { filename } : {}),
      };
    }

    throw new Error("Unsupported message content part");
  });

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    maxTokens,
    max_tokens,
  } = params;

  if (tools?.length || toolChoice || tool_choice) {
    throw new Error("Tool calling is not yet implemented in the OpenAI adapter");
  }

  const normalizedFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  const response = await getClient().responses.create({
    model: ENV.openAiModel,
    input: messages.map((message) => ({
      type: "message",
      role: normalizeRole(message.role),
      content: normalizeInputContent(message.content),
    })) as any,
    ...(normalizedFormat
      ? {
          text: {
            format: normalizedFormat,
          },
        }
      : {}),
    ...((maxTokens ?? max_tokens)
      ? {
          max_output_tokens: maxTokens ?? max_tokens,
        }
      : {}),
  });

  const content = response.output_text ?? "";

  return {
    id: response.id,
    created: Math.floor(Date.now() / 1000),
    model: ENV.openAiModel,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
        },
        finish_reason: response.status === "completed" ? "stop" : response.status ?? null,
      },
    ],
    usage: response.usage
      ? {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.total_tokens,
        }
      : undefined,
  };
}
