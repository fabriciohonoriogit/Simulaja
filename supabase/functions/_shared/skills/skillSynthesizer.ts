export interface ExecutionLog {
  taskName: string;
  category: string;
  stepsExecuted: { stepName: string; toolUsed: string; outputSummary: string }[];
}

export class SkillSynthesizer {
  /**
   * Transforma logs de execução bem-sucedida em um novo arquivo SKILL.md reutilizável pelo Jarvis
   */
  synthesizeSkill(log: ExecutionLog): string {
    const yamlHeader = `---
name: ${log.taskName.toLowerCase().replace(/\s+/g, "_")}
description: "Skill sintetizada automaticamente pelo Jarvis a partir de execução bem-sucedida de '${log.taskName}'."
category: ${log.category || "automacao"}
required_tools:
${Array.from(new Set(log.stepsExecuted.map((s) => `  - ${s.toolUsed}`))).join("\n")}
---`;

    const stepsMarkdown = log.stepsExecuted
      .map((s, idx) => `${idx + 1}. **${s.stepName}:** Invocação de \`${s.toolUsed}\`. (${s.outputSummary})`)
      .join("\n");

    return `${yamlHeader}

# Skill Aprendida: ${log.taskName}

## Objetivo
Procedimento automatizado gerado por sintetização de aprendizado do Jarvis 4.0.

## Passos do Procedimento
${stepsMarkdown}
`;
  }
}

export const skillSynthesizer = new SkillSynthesizer();
