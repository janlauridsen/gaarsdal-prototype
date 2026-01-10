#!/usr/bin/env node
/**
 * A5 – Human-readable aggregation layer
 * Input: A4 analysis JSON
 * Output: Aggregated, actionable summary (no recommendations)
 */

import fs from "fs";

function readInput() {
  const file = process.argv[2];
  if (!file) {
    throw new Error("Brug: node a5-summarize-cqc.js <a4-output.json>");
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function summarize(a4) {
  const sessions = a4.report;

  const summary = {
    generated_at: new Date().toISOString(),
    sessions_analyzed: sessions.length,
    dimensions: {
      progress: {},
      boundary: {},
      context_sensitivity: {}
    },
    focus_signal: null,
    observations: []
  };

  for (const s of sessions) {
    for (const dim of Object.keys(summary.dimensions)) {
      const val = s.signals[dim];
      summary.dimensions[dim][val] =
        (summary.dimensions[dim][val] || 0) + 1;
    }
  }

  // Derive high-level observations (rules are deterministic)
  const stalled = summary.dimensions.progress.stalled || 0;
  const insufficient = summary.dimensions.progress.insufficient_data || 0;
  const overextended =
    summary.dimensions.context_sensitivity.overextended || 0;

  if (stalled > sessions.length / 2) {
    summary.observations.push(
      "Fremdriftsstagnation er systemisk og ikke begrænset til enkelte cases."
    );
    summary.focus_signal = "progress";
  }

  if (overextended > 0) {
    summary.observations.push(
      "Overudfoldelse forekommer primært i lav-intensitetssamtaler."
    );
    if (!summary.focus_signal) {
      summary.focus_signal = "context_sensitivity";
    }
  }

  if (
    summary.dimensions.boundary.stable === sessions.length
  ) {
    summary.observations.push(
      "Afgrænsning er stabil på tværs af alle analyserede sessions."
    );
  }

  if (!summary.focus_signal && insufficient > 0) {
    summary.focus_signal = "data_volume";
    summary.observations.push(
      "Datamængden pr. session er ofte for lav til stærke fremdriftssignaler."
    );
  }

  summary.hypothesis_template = summary.focus_signal
    ? `Hvis RESHAPE justeres med fokus på '${summary.focus_signal}', bør de observerede mønstre ændre sig uden at påvirke øvrige stabile dimensioner.`
    : "Ingen dominerende spændingspunkter identificeret.";

  return summary;
}

try {
  const a4 = readInput();
  const a5 = summarize(a4);
  console.log(JSON.stringify(a5, null, 2));
} catch (err) {
  console.error("A5 FEJL:", err.message);
  process.exit(1);
}
