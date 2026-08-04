import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PersistentThreatDefenseService,
  persistentThreatDefensePolicy,
} from '../src/services/persistent-threat-defense.service.js';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function makeSignal(overrides = {}) {
  return {
    observedAt: Date.UTC(2026, 0, 1),
    source: { ipAddress: '203.0.113.25' },
    target: 'auth/login',
    signalType: 'failed_authentication',
    outcome: 'failed',
    sensorConfidence: 1,
    tags: ['authentication'],
    ...overrides,
  };
}

test('pseudonymizes raw source indicators before evidence is retained', async () => {
  const service = new PersistentThreatDefenseService({
    pseudonymizationKey: 'test-only-key',
  });

  const incident = await service.ingestSignal(makeSignal());
  const serializedEvidence = JSON.stringify(service.evidenceLedger);

  assert.match(incident.sourceFingerprint, /^hmac:/);
  assert.doesNotMatch(serializedEvidence, /203\.0\.113\.25/);
  assert.equal(service.verifyEvidenceChain(), true);
});

test('correlates low-and-slow probing across several weeks', async () => {
  const service = new PersistentThreatDefenseService({
    pseudonymizationKey: 'test-only-key',
  });

  let latestIncident;
  for (let observationIndex = 0; observationIndex < 10; observationIndex += 1) {
    latestIncident = await service.ingestSignal(makeSignal({
      observedAt: Date.UTC(2026, 0, 1) + observationIndex * 2 * DAY_IN_MILLISECONDS,
      target: `service-${observationIndex % 4}`,
      signalType: observationIndex % 3 === 0
        ? 'endpoint_probing'
        : 'failed_authentication',
    }));
  }

  assert.equal(latestIncident.observationCount, 10);
  assert.equal(latestIncident.distinctTargetCount, 4);
  assert.equal(latestIncident.scoreBreakdown.lowAndSlowScore, 20);
  assert.ok(latestIncident.riskScore >= 45);
  assert.notEqual(latestIncident.response.level, 'observe');
});

test('bounds Ai influence and keeps response selection deterministic', async () => {
  const modelAssessor = {
    async assess() {
      return {
        riskScore: 100,
        confidence: 1,
        reasons: ['The model suspects a coordinated campaign.'],
        requestedAction: 'hack_back',
      };
    },
  };
  const service = new PersistentThreatDefenseService({
    pseudonymizationKey: 'test-only-key',
    modelAssessor,
  });

  const incident = await service.ingestSignal(makeSignal());

  assert.equal(incident.scoreBreakdown.modelContribution, 20);
  assert.ok(incident.response.prohibitedActions.includes('hack_back'));
  assert.ok(incident.response.actions.every(({ scope }) => scope === 'protected_environment_only'));
  assert.ok(incident.response.actions.every(({ action }) => action !== 'hack_back'));
});

test('automates only reversible actions inside the protected environment', async () => {
  const executedActions = [];
  const responseExecutor = {
    async execute(action) {
      executedActions.push(action);
    },
  };
  const service = new PersistentThreatDefenseService({
    pseudonymizationKey: 'test-only-key',
    responseMode: 'enforce-local',
    responseExecutor,
  });

  let incident;
  for (let observationIndex = 0; observationIndex < 6; observationIndex += 1) {
    incident = await service.ingestSignal(makeSignal({
      observedAt: Date.UTC(2026, 0, 1) + observationIndex * 1_000,
      target: `evidence-store-${observationIndex % 2}`,
      signalType: 'evidence_tampering',
    }));
  }

  assert.ok(executedActions.length > 0);
  assert.ok(executedActions.every(({ scope }) => scope === 'protected_environment_only'));
  assert.ok(executedActions.every(({ action }) =>
    persistentThreatDefensePolicy.automaticLocalActions.includes(action)));
  assert.ok(incident.response.actions.some(({ approval }) =>
    approval === 'human_approval_required'));
});

test('prepares external reports for human review without claiming attribution', async () => {
  let currentTime = Date.UTC(2026, 0, 1);
  const service = new PersistentThreatDefenseService({
    clock: () => currentTime,
    pseudonymizationKey: 'test-only-key',
  });

  const incident = await service.ingestSignal(makeSignal({ observedAt: currentTime }));
  currentTime += 1_000;
  const report = service.prepareExternalReport(incident.incidentId);

  assert.equal(report.approvalStatus, 'human_review_required');
  assert.equal(report.destination, 'not_selected');
  assert.equal(report.attributionStatus, 'unverified_source_indicator');
  assert.match(report.statement, /does not establish who controlled/i);
});

test('detects evidence ledger tampering', async () => {
  const service = new PersistentThreatDefenseService({
    pseudonymizationKey: 'test-only-key',
  });

  await service.ingestSignal(makeSignal());
  assert.equal(service.verifyEvidenceChain(), true);

  service.evidenceLedger[0].riskScore = 100;
  assert.equal(service.verifyEvidenceChain(), false);
});
