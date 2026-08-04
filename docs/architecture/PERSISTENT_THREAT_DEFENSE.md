# Persistent Threat Defense

**Status:** Implemented prototype core, not a production intrusion-detection or
incident-response service. The current SentinelAI Treasury Watchdog remains a
DemoLand component with a mock detector. This module begins a separate,
testable path toward long-horizon defensive monitoring.

## Goal

Persistent attackers often avoid a loud break-in. They probe one endpoint, wait,
try another account, change infrastructure, test recovery, and slowly learn the
system. Each individual event may look harmless. The campaign becomes visible
only when signals are correlated across hours, weeks, targets, credentials, and
control planes.

SentinelAI should:

1. recognize low-and-slow attack campaigns;
2. preserve privacy-minimized, tamper-evident evidence;
3. strengthen defenses inside systems we own or are authorized to protect;
4. require human approval for disruptive containment;
5. prepare accurate reports for the correct provider, owner, customer, or law
   enforcement channel; and
6. avoid retaliation, unsupported attribution, and collection of unnecessary
   personal data.

## Defensive boundary

“Fight back” means **active defense inside the protected environment**:

- require stronger authentication;
- rate-limit or slow expensive paths;
- revoke suspicious sessions;
- rotate exposed credentials;
- disable a high-risk action;
- isolate an affected service;
- preserve evidence and page a human incident commander; and
- report verified indicators through authorized channels.

It does not mean hacking the suspected source, exploiting remote hosts,
destroying remote data, launching denial of service, doxxing an operator, or
publishing an attribution claim. Source IP addresses and infrastructure can be
compromised, proxied, spoofed, shared, or operated by innocent third parties.

## Implemented prototype

The prototype lives at
`backend/src/services/persistent-threat-defense.service.js` and provides:

- strict, privacy-minimized signal validation;
- keyed source pseudonymization when a key is injected;
- 15-minute, 24-hour, 30-day, and 90-day campaign correlation;
- explicit detection of low-and-slow persistence and target spread;
- an optional Ai assessor with a capped influence on the final score;
- deterministic response tiers from observe through emergency;
- automatic execution of only reversible, local actions;
- human-approval labels for disruptive containment;
- an append-only evidence hash chain;
- external report preparation that requires human review; and
- explicit prohibited-response and no-attribution rules.

The service defaults to `recommend-only`. Even in `enforce-local` mode, it calls
an injected executor only for the small local automation allowlist. The
prototype does not connect to a firewall, identity provider, security
orchestration platform, HelixCTW, ZKSplunk, or an external reporting endpoint.

## Ai's proper role

Ai is useful for recognizing relationships that fixed rules miss:

- semantically similar probes with different strings;
- slow campaigns crossing multiple services;
- behavioral drift after an account or agent is compromised;
- tool and infrastructure reuse across incidents;
- likely tactics and investigation priorities; and
- concise explanations for a human reviewer.

Ai is not the authority for blocking, attribution, or retaliation. The prototype
enforces four guardrails:

1. deterministic evidence can never be reduced by an Ai score;
2. Ai can add no more than 20 points to a 100-point campaign score;
3. confidence below 0.5 contributes nothing; and
4. the model cannot select or execute a response action.

The future model should be evaluated against time-split attack campaigns,
adversarial inputs, false-positive cost, drift, explanation quality, and missed
low-and-slow behavior. Accuracy claims must link to a reproducible dataset and
evaluation report.

## Signal contract

Sensors submit a logical event, not a raw log dump:

| Field | Meaning |
|-------|---------|
| `observedAt` | Unix time in milliseconds from an authenticated sensor |
| `source` | Existing fingerprint or indicators that are immediately pseudonymized |
| `target` | Logical service or protected resource, never a secret |
| `signalType` | Approved defensive signal vocabulary |
| `outcome` | `allowed`, `blocked`, `failed`, or `succeeded` |
| `sensorConfidence` | Sensor confidence between 0 and 1 |
| `tags` | Short, privacy-reviewed labels only |

Raw authorization headers, session tokens, private keys, seed phrases,
biometric data, request bodies, and unnecessary personal information must not
enter this service. A production collector should keep high-sensitivity evidence
in a separately governed vault and pass only commitments or narrow references.

## Response ladder

| Tier | Purpose | Example actions |
|------|---------|-----------------|
| Observe | Establish evidence and context | Preserve evidence, increase observability |
| Challenge | Test whether the actor still controls a trusted factor | Require step-up authentication |
| Throttle | Reduce attacker learning and resource consumption | Rate-limit source, slow expensive paths |
| Contain | Stop likely compromise from expanding | Revoke sessions or disable high-risk actions after approval |
| Emergency | Protect the blast radius | Isolate service, rotate credentials, page incident commander after approval |

Production policy should consider asset value, business impact, user role,
AgenticDID authority, RWAz asset semantics, confidence, and reversibility. A
single threshold must not freeze critical infrastructure without an escape path.

## Evidence and reporting

Each normalized observation is chained to the previous evidence hash. This
detects later modification in the in-memory prototype. Production should add:

- authenticated sensor signatures;
- a durable write-once evidence store;
- synchronized and independently verified time;
- chain-of-custody records;
- retention and legal-hold policies;
- encrypted access with role separation;
- HelixCTW artifact lineage and reconstruction;
- optional Midnight commitments for tamper evidence; and
- ZKSplunk correlation and dashboards over privacy-reviewed events.

Reports should distinguish three things:

1. **Observed indicator:** what the sensor actually saw.
2. **Infrastructure association:** who appears to own or provide the source
   network or service.
3. **Actor attribution:** who controlled it, which usually requires more
   evidence and sometimes legal process.

The prototype prepares a report with `human_review_required` and no destination.
A reviewed integration may later send to an internal security team, customer,
cloud provider abuse desk, Computer Security Incident Response Team, law
enforcement, or regulator as policy and law require.

## DIDzM cross-pollination

- **DIDz:** authenticate sensors, responders, and disclosure authority without
  publishing their full identities.
- **AgenticDID:** grant a response agent narrow, expiring authority for one
  action, target, and impact cap.
- **RWAz:** attach asset value, controller, and criticality semantics to the risk
  decision without conflating ownership with access.
- **HelixCTW:** retain reconstructible encrypted evidence and policy lineage.
- **ZKSplunk:** correlate privacy-reviewed events, surface campaigns, and support
  operator investigations.
- **CryptoSure:** produce consented security-control and incident evidence for
  underwriting or claims without implying coverage or automatic payment.
- **DIDzM Control Envelope:** bind the actor, authority, protected asset,
  selected response policy, evidence commitment, and final receipt.

## Production gates

Before this can protect a real environment:

1. authenticate every sensor and response executor;
2. require a secret-managed pseudonymization key and key rotation;
3. replace memory maps with a durable, encrypted event and campaign store;
4. define tenant isolation and per-tenant retention;
5. connect only reversible local controls first;
6. require dual control for isolation, credential rotation, and customer impact;
7. add idempotency, replay protection, queues, retries, and dead-letter handling;
8. test false positives, evasion, model poisoning, log injection, and alert floods;
9. perform tabletop exercises with legal, privacy, support, and incident teams;
10. document external reporting authority and evidence-disclosure rules; and
11. complete independent security and privacy reviews.

## Test command

From `SentinelAI/backend`:

```bash
npm run test:persistent-defense
```

The tests cover source pseudonymization, long-horizon correlation, bounded Ai
influence, local-only automation, human-reviewed reports, and evidence-chain
tamper detection.
