// Persistent Threat Defense Service
//
// This service correlates low-and-slow hostile behavior across long time windows.
// Ai may contribute a bounded risk assessment, but deterministic policy selects
// the response. The service never attacks, scans, or disrupts an external system.

import EventEmitter from 'node:events';
import { createHash, createHmac } from 'node:crypto';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const SIGNAL_WEIGHTS = Object.freeze({
  failed_authentication: 8,
  account_enumeration: 12,
  endpoint_probing: 14,
  privilege_probe: 20,
  rate_limit_evasion: 22,
  authorization_bypass: 28,
  malicious_payload: 30,
  secret_access_probe: 32,
  evidence_tampering: 36,
  insider_anomaly: 20,
});

const RESPONSE_LADDER = Object.freeze([
  {
    minimumScore: 0,
    level: 'observe',
    actions: ['preserve_evidence', 'increase_observability'],
  },
  {
    minimumScore: 25,
    level: 'challenge',
    actions: ['preserve_evidence', 'require_step_up_authentication'],
  },
  {
    minimumScore: 45,
    level: 'throttle',
    actions: ['preserve_evidence', 'rate_limit_source', 'slow_expensive_paths'],
  },
  {
    minimumScore: 65,
    level: 'contain',
    actions: [
      'preserve_evidence',
      'rate_limit_source',
      'revoke_related_sessions',
      'disable_high_risk_action',
    ],
  },
  {
    minimumScore: 85,
    level: 'emergency',
    actions: [
      'preserve_evidence',
      'isolate_affected_service',
      'rotate_exposed_credentials',
      'page_human_incident_commander',
    ],
  },
]);

// These actions can be automated because they operate only inside the protected
// environment and are reversible. Everything else requires human approval.
const AUTOMATIC_LOCAL_ACTIONS = new Set([
  'preserve_evidence',
  'increase_observability',
  'require_step_up_authentication',
  'rate_limit_source',
  'slow_expensive_paths',
]);

const VALID_OUTCOMES = new Set(['allowed', 'blocked', 'failed', 'succeeded']);

function clampNumber(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const sortedKeys = Object.keys(value).sort();
    return `{${sortedKeys.map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function hashText(value) {
  return createHash('sha256').update(value).digest('hex');
}

export class PersistentThreatDefenseService extends EventEmitter {
  constructor({
    clock = () => Date.now(),
    pseudonymizationKey,
    modelAssessor = null,
    evidenceSink = null,
    responseExecutor = null,
    responseMode = 'recommend-only',
    retentionDays = 90,
  } = {}) {
    super();

    if (!['recommend-only', 'enforce-local'].includes(responseMode)) {
      throw new Error('responseMode must be recommend-only or enforce-local');
    }

    this.clock = clock;
    this.pseudonymizationKey = pseudonymizationKey;
    this.modelAssessor = modelAssessor;
    this.evidenceSink = evidenceSink;
    this.responseExecutor = responseExecutor;
    this.responseMode = responseMode;
    this.retentionMilliseconds = retentionDays * DAY_IN_MILLISECONDS;

    this.campaigns = new Map();
    this.incidents = new Map();
    this.evidenceLedger = [];
    this.latestEvidenceHash = 'GENESIS';
  }

  async ingestSignal(signal) {
    const normalizedSignal = this.normalizeSignal(signal);
    this.pruneExpiredEvents(normalizedSignal.observedAt);

    const campaign = this.getOrCreateCampaign(normalizedSignal);
    campaign.events.push(normalizedSignal);
    campaign.targets.add(normalizedSignal.target);
    campaign.lastObservedAt = normalizedSignal.observedAt;

    const modelAssessment = await this.getBoundedModelAssessment(
      normalizedSignal,
      campaign,
    );
    const scoreBreakdown = this.calculateCampaignScore(
      campaign,
      normalizedSignal,
      modelAssessment,
    );
    const response = this.selectResponse(scoreBreakdown.totalScore);

    const incident = {
      incidentId: campaign.incidentId,
      sourceFingerprint: normalizedSignal.sourceFingerprint,
      firstObservedAt: campaign.firstObservedAt,
      lastObservedAt: campaign.lastObservedAt,
      observationCount: campaign.events.length,
      distinctTargetCount: campaign.targets.size,
      latestSignalType: normalizedSignal.signalType,
      riskScore: scoreBreakdown.totalScore,
      scoreBreakdown,
      modelAssessment,
      response,
      attributionStatus: 'unverified_source_indicator',
      externalReportStatus: 'not_prepared',
      updatedAt: this.clock(),
    };

    const evidenceEntry = this.appendEvidence({
      incidentId: incident.incidentId,
      signal: normalizedSignal,
      riskScore: incident.riskScore,
      responseLevel: response.level,
    });
    incident.latestEvidenceHash = evidenceEntry.evidenceHash;

    this.incidents.set(incident.incidentId, incident);
    await this.persistEvidence(evidenceEntry);
    await this.executeAllowedLocalActions(incident);

    this.emit('incidentUpdated', structuredClone(incident));
    return structuredClone(incident);
  }

  normalizeSignal(signal) {
    if (!signal || typeof signal !== 'object') {
      throw new TypeError('signal must be an object');
    }

    if (!Object.hasOwn(SIGNAL_WEIGHTS, signal.signalType)) {
      throw new Error(`Unsupported signalType: ${signal.signalType}`);
    }

    if (typeof signal.target !== 'string' || signal.target.trim().length === 0) {
      throw new Error('target must be a non-empty logical service or resource name');
    }

    const observedAt = Number(signal.observedAt ?? this.clock());
    if (!Number.isFinite(observedAt) || observedAt <= 0) {
      throw new Error('observedAt must be a positive Unix timestamp in milliseconds');
    }

    const outcome = signal.outcome ?? 'blocked';
    if (!VALID_OUTCOMES.has(outcome)) {
      throw new Error(`Unsupported outcome: ${outcome}`);
    }

    return {
      eventId: signal.eventId || `evt_${hashText(`${observedAt}:${signal.signalType}:${signal.target}`).slice(0, 20)}`,
      observedAt,
      sourceFingerprint: this.fingerprintSource(signal.source),
      target: signal.target.trim().slice(0, 160),
      signalType: signal.signalType,
      outcome,
      sensorConfidence: clampNumber(Number(signal.sensorConfidence ?? 1), 0, 1),
      // Tags are deliberately constrained. Raw headers, payloads, tokens,
      // credentials, IP addresses, and personal data do not belong here.
      tags: Array.isArray(signal.tags)
        ? signal.tags
            .filter((tag) => typeof tag === 'string')
            .map((tag) => tag.slice(0, 80))
            .slice(0, 12)
        : [],
    };
  }

  fingerprintSource(source) {
    if (!source || typeof source !== 'object') {
      throw new Error('source must contain an existing fingerprint or source indicators');
    }

    if (typeof source.fingerprint === 'string' && source.fingerprint.length >= 16) {
      return source.fingerprint.slice(0, 128);
    }

    const sourceMaterial = stableJson({
      autonomousSystem: source.autonomousSystem ?? null,
      deviceId: source.deviceId ?? null,
      ipAddress: source.ipAddress ?? null,
      sessionFamily: source.sessionFamily ?? null,
    });

    if (sourceMaterial === stableJson({
      autonomousSystem: null,
      deviceId: null,
      ipAddress: null,
      sessionFamily: null,
    })) {
      throw new Error('source does not contain a usable indicator');
    }

    if (this.pseudonymizationKey) {
      return `hmac:${createHmac('sha256', this.pseudonymizationKey)
        .update(sourceMaterial)
        .digest('hex')}`;
    }

    // An unkeyed digest prevents accidental plaintext logging, but it is not
    // sufficient for production because enumerable values such as IP addresses
    // may be guessed. Production startup should require an injected key.
    return `unkeyed-demo:${hashText(sourceMaterial)}`;
  }

  getOrCreateCampaign(signal) {
    const campaignKey = signal.sourceFingerprint;
    let campaign = this.campaigns.get(campaignKey);

    if (!campaign) {
      campaign = {
        incidentId: `inc_${hashText(campaignKey).slice(0, 20)}`,
        sourceFingerprint: campaignKey,
        firstObservedAt: signal.observedAt,
        lastObservedAt: signal.observedAt,
        events: [],
        targets: new Set(),
      };
      this.campaigns.set(campaignKey, campaign);
    }

    return campaign;
  }

  async getBoundedModelAssessment(signal, campaign) {
    if (!this.modelAssessor?.assess) {
      return {
        available: false,
        riskScore: 0,
        confidence: 0,
        reasons: [],
      };
    }

    try {
      const assessment = await this.modelAssessor.assess({
        signal: structuredClone(signal),
        campaign: {
          ageMilliseconds: signal.observedAt - campaign.firstObservedAt,
          observationCount: campaign.events.length,
          distinctTargetCount: campaign.targets.size,
          recentSignalTypes: campaign.events.slice(-20).map((event) => event.signalType),
        },
      });

      return {
        available: true,
        riskScore: clampNumber(Number(assessment?.riskScore ?? 0), 0, 100),
        confidence: clampNumber(Number(assessment?.confidence ?? 0), 0, 1),
        reasons: Array.isArray(assessment?.reasons)
          ? assessment.reasons
              .filter((reason) => typeof reason === 'string')
              .map((reason) => reason.slice(0, 200))
              .slice(0, 8)
          : [],
      };
    } catch {
      // Detection continues safely if an Ai provider is unavailable or returns
      // malformed output. The deterministic policy remains authoritative.
      return {
        available: false,
        riskScore: 0,
        confidence: 0,
        reasons: ['Ai assessment unavailable'],
      };
    }
  }

  calculateCampaignScore(campaign, latestSignal, modelAssessment) {
    const fifteenMinutesAgo = latestSignal.observedAt - 15 * 60 * 1000;
    const oneDayAgo = latestSignal.observedAt - DAY_IN_MILLISECONDS;
    const thirtyDaysAgo = latestSignal.observedAt - 30 * DAY_IN_MILLISECONDS;
    const recent15Minutes = campaign.events.filter((event) => event.observedAt >= fifteenMinutesAgo).length;
    const recentDay = campaign.events.filter((event) => event.observedAt >= oneDayAgo).length;
    const recent30Days = campaign.events.filter((event) => event.observedAt >= thirtyDaysAgo).length;
    const campaignAge = latestSignal.observedAt - campaign.firstObservedAt;

    const baseSignalScore = SIGNAL_WEIGHTS[latestSignal.signalType] * latestSignal.sensorConfidence;
    const burstScore = Math.min(Math.max(recent15Minutes - 1, 0) * 4, 20);
    const dailyPersistenceScore = Math.min(Math.max(recentDay - 1, 0) * 2, 20);
    const monthlyPersistenceScore = Math.min(Math.max(recent30Days - 2, 0) * 0.75, 15);
    const targetSpreadScore = Math.min(Math.max(campaign.targets.size - 1, 0) * 3, 15);
    const lowAndSlowScore = campaignAge >= 7 * DAY_IN_MILLISECONDS && recent30Days >= 8 ? 20 : 0;

    // Ai can add at most 20 points and only in proportion to confidence. It can
    // never lower deterministic evidence or directly choose an action.
    const modelContribution = modelAssessment.confidence >= 0.5
      ? Math.min(modelAssessment.riskScore * modelAssessment.confidence * 0.2, 20)
      : 0;

    const totalScore = Math.round(clampNumber(
      baseSignalScore
        + burstScore
        + dailyPersistenceScore
        + monthlyPersistenceScore
        + targetSpreadScore
        + lowAndSlowScore
        + modelContribution,
      0,
      100,
    ));

    return {
      totalScore,
      baseSignalScore: Math.round(baseSignalScore),
      burstScore,
      dailyPersistenceScore,
      monthlyPersistenceScore,
      targetSpreadScore,
      lowAndSlowScore,
      modelContribution: Math.round(modelContribution),
    };
  }

  selectResponse(score) {
    const selectedTier = [...RESPONSE_LADDER]
      .reverse()
      .find((tier) => score >= tier.minimumScore);

    return {
      level: selectedTier.level,
      actions: selectedTier.actions.map((action) => ({
        action,
        scope: 'protected_environment_only',
        approval: AUTOMATIC_LOCAL_ACTIONS.has(action)
          ? 'automatic_local_allowed'
          : 'human_approval_required',
      })),
      prohibitedActions: [
        'hack_back',
        'exploit_source_system',
        'destroy_remote_data',
        'denial_of_service_against_source',
        'publicly_attribute_without_verified_evidence',
      ],
    };
  }

  appendEvidence(payload) {
    const capturedAt = this.clock();
    const evidencePayload = {
      sequence: this.evidenceLedger.length + 1,
      capturedAt,
      previousEvidenceHash: this.latestEvidenceHash,
      ...payload,
    };
    const evidenceHash = hashText(stableJson(evidencePayload));
    const entry = { ...evidencePayload, evidenceHash };

    this.evidenceLedger.push(entry);
    this.latestEvidenceHash = evidenceHash;
    return entry;
  }

  verifyEvidenceChain() {
    let expectedPreviousHash = 'GENESIS';

    for (const entry of this.evidenceLedger) {
      const { evidenceHash, ...payload } = entry;
      if (payload.previousEvidenceHash !== expectedPreviousHash) {
        return false;
      }
      if (hashText(stableJson(payload)) !== evidenceHash) {
        return false;
      }
      expectedPreviousHash = evidenceHash;
    }

    return true;
  }

  async persistEvidence(entry) {
    if (this.evidenceSink?.append) {
      await this.evidenceSink.append(structuredClone(entry));
    }
  }

  async executeAllowedLocalActions(incident) {
    if (this.responseMode !== 'enforce-local' || !this.responseExecutor?.execute) {
      return;
    }

    for (const recommendedAction of incident.response.actions) {
      if (recommendedAction.approval !== 'automatic_local_allowed') {
        continue;
      }

      await this.responseExecutor.execute({
        incidentId: incident.incidentId,
        sourceFingerprint: incident.sourceFingerprint,
        action: recommendedAction.action,
        scope: recommendedAction.scope,
      });
    }
  }

  prepareExternalReport(incidentId) {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const report = {
      reportId: `report_${hashText(`${incidentId}:${incident.latestEvidenceHash}`).slice(0, 20)}`,
      incidentId,
      preparedAt: this.clock(),
      approvalStatus: 'human_review_required',
      destination: 'not_selected',
      attributionStatus: incident.attributionStatus,
      sourceFingerprint: incident.sourceFingerprint,
      firstObservedAt: incident.firstObservedAt,
      lastObservedAt: incident.lastObservedAt,
      observationCount: incident.observationCount,
      distinctTargetCount: incident.distinctTargetCount,
      latestEvidenceHash: incident.latestEvidenceHash,
      statement: 'This report describes observed indicators. It does not establish who controlled the source system.',
    };

    incident.externalReportStatus = 'human_review_required';
    this.incidents.set(incidentId, incident);
    return report;
  }

  getIncident(incidentId) {
    const incident = this.incidents.get(incidentId);
    return incident ? structuredClone(incident) : null;
  }

  listIncidents() {
    return [...this.incidents.values()].map((incident) => structuredClone(incident));
  }

  pruneExpiredEvents(now) {
    const cutoff = now - this.retentionMilliseconds;
    for (const [campaignKey, campaign] of this.campaigns.entries()) {
      campaign.events = campaign.events.filter((event) => event.observedAt >= cutoff);
      if (campaign.events.length === 0) {
        this.campaigns.delete(campaignKey);
      }
    }
  }
}

export const persistentThreatDefensePolicy = Object.freeze({
  signalTypes: Object.keys(SIGNAL_WEIGHTS),
  responseLevels: RESPONSE_LADDER.map((tier) => tier.level),
  automaticLocalActions: [...AUTOMATIC_LOCAL_ACTIONS],
});
