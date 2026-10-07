import { RelationshipTag } from "@prisma/client";

export interface CreateRelationshipProposalInput {
  senderId: string;
  receiverId: string;
  tag: RelationshipTag;
  message?: string;
}

export interface AcceptRelationshipProposalInput {
  userId: string;
  proposalId: string;
}