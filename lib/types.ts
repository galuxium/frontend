export type Role = 'user' | 'assistant' | 'system';

// add or update these types where you define ChatMessage / MVP
export type MVPFile = {
  name: string;
  url?: string;           // data: or proxied url for images / download
  mime?: string;
  content?: string;       // raw content (for preview)
};

export type MVP = {
  id?: string;
  user_id?: string;
  created_at?: string;
  name: string;
  prompt: string;
  description?: string | null;
  summary?: string | null;
  category?: string | null;
  tags?: string[] | null;
  files?: MVPFile[] | null;
  raw_code?: Record<string, string> | null; // optional jsonb raw
};

// extend your ChatMessage type
export type ChatMessage = {
  id: string;
  conversation_id?: string;
  user_id?: string | null;
  role: "user" | "assistant" | string;
  content: string;
  model_used?: string | null;
  created_at?: string;
  mvp?: MVP | null; // attach MVP if present
};

// File: frontend/types/galuxium.d.ts

export type AgentPhase =
  | "BizMind"      // Market intelligence, opportunity analysis
  | "BrandPulse"   // Branding & storytelling
  | "CodeWeaver"   // Technical build & validation
  | "LaunchLens"  // Go-to-market & deployment
  |"setup"
  |"classification";

export interface IdeaClassification {
  category: string;
  tags: string[];
  confidence: number;
  summary: string;
}

export interface AgentOutput {
  phase: AgentPhase;
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  message: string;
  logs: string[];
  file_url?: string;

  // Specific structured outputs per agent
  data:
    | BizMindOutput
    | BrandPulseOutput
    | CodeWeaverOutput
    | LaunchLensOutput
    | null;
}

export interface BizMindOutput {
  marketSize: string;
  competitors: string[];
  opportunities: string[];
  problemStatement: string;
  targetAudience: string;
}

export interface BrandPulseOutput {
  nameSuggestions: string[];
  taglines: string[];
  toneOfVoice: string;
  brandColors: string[];
  logoPrompt: string;
}

export interface CodeWeaverOutput {
  stack: string[];
  repoUrl?: string;
  deploymentUrl?: string;
  architectureSummary: string;
  techSpec: string;
}

export interface LaunchLensOutput {
  launchPlan: string[];
  marketingAssets: string[];
  pricingStrategy: string;
  channels: string[];
}

export interface AgentData {
  phase: AgentPhase;
  sub_phase?: string;
  progress?: number;
  message?: string;
  messages?: string[];
  file_url?: string;
  output?: AgentOutput;
}


export interface ModelProfile {
  slug: string;
  name: string;
  model:string;
  description?: string;
  system_prompt: string;
  example_messages?: Array<{ role: Role; content: string }>;
}

export interface Idea {
  title: string;
  summary: string;
  category: string;
  pain_point: string;
  solution: string;
  innovation_score: number;
}

export interface Market {
  market_size_tam: string;
  sam: string;
  som: string;
  competitors: string[];
  demand_trend: string;
  funding_sentiment: string;
  risk_score: number;
  confidence: number;
}

export interface AnalyzedData {
  idea: Idea;
  market: Market;
  timestamp: string;
}

export interface FundingData {
  funding_stage: string;
  suggested_amount_usd: string;
  valuation_estimate: string;
  investor_targets: string[];
  funding_strategy: string;
  confidence: number;
}

export interface RoadmapData {
  milestones: { month: number; goals: string[] }[];
}

export interface Conversation {
  id: string;
  title: string;
  user_id?: string | null;
  model_slug?: string | null;
  created_at?: string;
  updated_at?: string | null;
}
export interface UserProfile {
  name: string;
  avatarUrl: string;
  plan: "free" | "pro";
}
export interface Message {
  id: string;
  conversation_id: string;
  user_id?: string | null;
  role: Role;
  content: string;
  model_used?: string | null;
  created_at?: string;
  hasMVP?:boolean;
}

export interface ModelOption {
  name: string;
  id: string;
  description: string;
}

export interface Code {
  html: string;
  css: string;
  js: string;
}

export interface ClassifyData {
  isWebsite: boolean;
  intentType: string;
  confidence: number;
  notes?: string;
  lastGenerated?: Code | null;
  lastRawResponse?: string;
  originalPrompt?: string;
}

export interface ProfileForm {
  name: string;
  avatar_url: string | null;
  email: string;
  username: string;
  plan: string;
  tokens_used: number;
  userTokens:number,
  assistantTokens:number
};

