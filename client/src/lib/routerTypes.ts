/**
 * Convenience aliases for RouterOutputs — keeps pages free of `any` when typing list rows.
 */
import type { RouterInputs, RouterOutputs } from "./trpc";

export type ElementOfPaginatedOrArray<T> = T extends { data: (infer U)[] }
  ? U
  : T extends (infer U)[]
    ? U
    : never;

export type ClientListItem = ElementOfPaginatedOrArray<RouterOutputs["clients"]["list"]>;
export type ProjectListItem = ElementOfPaginatedOrArray<RouterOutputs["projects"]["list"]>;
export type PaymentListItem = ElementOfPaginatedOrArray<RouterOutputs["payments"]["getAll"]>;
export type NoteListItem = ElementOfPaginatedOrArray<RouterOutputs["notes"]["list"]>;
export type LeadListItem = ElementOfPaginatedOrArray<RouterOutputs["leads"]["list"]>;
export type ProposalListItem = ElementOfPaginatedOrArray<RouterOutputs["proposals"]["list"]>;
export type DeliverableListItem = ElementOfPaginatedOrArray<RouterOutputs["deliverables"]["list"]>;
export type PipelineRunRow = ElementOfPaginatedOrArray<RouterOutputs["pipeline"]["list"]>;

export type PaymentByClientItem = ElementOfPaginatedOrArray<RouterOutputs["payments"]["getByClient"]>;
export type NoteByClientItem = ElementOfPaginatedOrArray<RouterOutputs["notes"]["getByClient"]>;
export type ProjectByClientItem = ElementOfPaginatedOrArray<RouterOutputs["projects"]["getByClient"]>;
export type ClientDiagnosisRow = ElementOfPaginatedOrArray<RouterOutputs["clients"]["diagnosisForClient"]>;
export type DashboardPipelineRecentRun = RouterOutputs["dashboard"]["pipelineAnalytics"]["recentRuns"][number];
export type NoteCreateCategory = RouterInputs["notes"]["create"]["category"];

export type PortalLinkRow = RouterOutputs["portal"]["getLinks"][number];
export type PortalProjectDeliverable = RouterOutputs["portal"]["viewProject"]["deliverables"][number];
export type PortalRevisionRow = RouterOutputs["portal"]["getDeliverableDetails"]["revisions"][number];
export type PortalCommentRow = RouterOutputs["portal"]["getDeliverableDetails"]["comments"][number];

/** Brand Twin dashboard client row + snapshot-ish score fields */
export type BrandTwinDimScores = {
  overallScore: number;
  identityScore: number | null;
  positioningScore: number | null;
  messagingScore: number | null;
  visualScore: number | null;
  digitalPresenceScore: number | null;
  reputationScore: number | null;
  marketFitScore: number | null;
};

/** UI dimension keys (camelCase) → snapshot column names */
const DIM_TO_SCORE_KEY: Record<string, keyof BrandTwinDimScores> = {
  identity: "identityScore",
  positioning: "positioningScore",
  messaging: "messagingScore",
  visual: "visualScore",
  digitalPresence: "digitalPresenceScore",
  reputation: "reputationScore",
  marketFit: "marketFitScore",
};

export function brandTwinDimensionScore(row: BrandTwinDimScores, dimKey: string): number {
  const field = DIM_TO_SCORE_KEY[dimKey];
  if (!field) return 0;
  const v = row[field];
  return Number(v ?? 0);
}

export type BrandTwinAlertRow = RouterOutputs["brandTwin"]["allAlerts"] extends (infer U)[] ? U : never;

export type ToolMetaRow = RouterOutputs["tools"]["meta"]["tools"][number];

export type KnowledgeListItem = ElementOfPaginatedOrArray<RouterOutputs["knowledge"]["list"]>;
export type KnowledgeCategory = RouterInputs["knowledge"]["create"]["category"];
export type ResearchListItem = ElementOfPaginatedOrArray<RouterOutputs["research"]["list"]>;
export type ResearchConductFull = RouterOutputs["research"]["conductFull"];
export type QuickCheckSubmitResult = RouterOutputs["leads"]["submitQuickCheck"];
/** ai_conversations row — `conversations.list` may be empty without projectId; shape matches DB JSON messages. */
export type ConversationListItem = {
  id: number;
  projectId: number | null;
  clientId: number | null;
  context: string;
  messages: unknown;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};
export type DashboardPlaybookMap = RouterOutputs["dashboard"]["playbooks"]["playbooks"];
export type DashboardPlaybookStage = DashboardPlaybookMap[string]["stages"][number];
export type DashboardPlaybookStep = DashboardPlaybookStage["steps"][number];
export type ProposalDetailRow = NonNullable<RouterOutputs["proposals"]["getById"]>;

export type AuthMe = RouterOutputs["auth"]["me"];
export type CreditHistoryRow = ElementOfPaginatedOrArray<RouterOutputs["credits"]["history"]>;
