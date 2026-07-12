export const CORE_SAFETY_BOUNDARY_FIXTURE = {
  id: 'core-safety-boundary-foundations-v0-1',
  version: '0.1.0',
  referenceRecords: [
    {
      referenceId: 'brand:alpha',
      objectType: 'Brand',
      referenceDomain: 'brand',
      status: 'Active',
      safeLabel: 'Alpha'
    },
    {
      referenceId: 'document:deleted',
      objectType: 'Document',
      referenceDomain: 'document',
      status: 'DeletedReferenceOnly',
      safeLabel: null
    }
  ],
  agentRegistry: [
    {
      agentReferenceId: 'agent:knowledge',
      registryKey: 'knowledge-agent-v0-1',
      status: 'Active',
      allowedCapabilities: ['Read', 'Summarize', 'ValidateReference'],
      contractVersion: 'v0.1.0'
    },
    {
      agentReferenceId: 'agent:suspended',
      registryKey: 'suspended-agent-v0-1',
      status: 'Suspended',
      allowedCapabilities: ['Read'],
      contractVersion: 'v0.1.0'
    }
  ],
  validAiContext: {
    aiAssisted: true,
    agentReferenceId: 'agent:knowledge',
    agentRegistryKey: 'knowledge-agent-v0-1',
    capabilityUsed: 'Summarize',
    dataAccessScope: 'SafeSummaryOnly',
    outputMode: 'SafeSummary',
    aiGenerated: true,
    humanReviewRequired: false,
    sourceReferenceIds: ['document:source-one'],
    restrictedFieldsOmitted: true
  },
  supportedContractVersions: ['v0.1.0']
} as const;
