import { mcpRegistry } from "../mcp/registry.ts";
import { MCPExecutionResult } from "../mcp/types.ts";

export interface PlanStep {
  id: string;
  toolName: string;
  description: string;
  args: Record<string, any>;
  dependsOn?: string[];
  status: "pending" | "running" | "completed" | "failed" | "repaired";
  result?: MCPExecutionResult;
  retryCount?: number;
}

export interface DAGPlan {
  id: string;
  goal: string;
  steps: PlanStep[];
  status: "in_progress" | "completed" | "failed";
}

export class DAGPlannerEngine {
  /**
   * Executa um plano DAG com validação de checkpoints e auto-reparo de erros
   */
  async executePlan(
    plan: DAGPlan,
    supabaseClient: any,
    context: { organizacaoId?: string; userId?: string }
  ): Promise<DAGPlan> {
    plan.status = "in_progress";

    for (const step of plan.steps) {
      // 1. Verifica se todas as dependências do passo já foram concluídas com sucesso
      if (step.dependsOn && step.dependsOn.length > 0) {
        const depsOk = step.dependsOn.every((depId) => {
          const depStep = plan.steps.find((s) => s.id === depId);
          return depStep && (depStep.status === "completed" || depStep.status === "repaired");
        });

        if (!depsOk) {
          step.status = "failed";
          step.result = {
            success: false,
            error: `Dependência não atendida para a etapa '${step.description}'.`,
          };
          continue;
        }
      }

      // 2. Executa a etapa via MCPRegistry
      step.status = "running";
      step.retryCount = step.retryCount || 0;

      let result = await mcpRegistry.execute(step.toolName, step.args, supabaseClient, context);

      // 3. Mecanismo de Auto-Reparo (Self-Correction Loop do Hermes/OS-Copilot)
      if (!result.success && step.retryCount < 2) {
        console.warn(`[DAG Planner] Tentando auto-reparo na etapa '${step.id}' (${step.toolName}). Erro: ${result.error}`);
        step.retryCount++;

        // Estratégia de correção: Se busca de lead falhou por nome exato, formata para busca flexível
        if (step.toolName === "mcp_crm_search_leads" && step.args.nome) {
          step.args.nome = step.args.nome.trim();
        }

        // Re-executa com argumentos ajustados
        result = await mcpRegistry.execute(step.toolName, step.args, supabaseClient, context);
        if (result.success) {
          step.status = "repaired";
        } else {
          step.status = "failed";
        }
      } else if (result.success) {
        step.status = "completed";
      } else {
        step.status = "failed";
      }

      step.result = result;

      // Se um passo crítico falhar e não puder ser reparado, interrompe o fluxo com segurança
      if (step.status === "failed") {
        console.error(`[DAG Planner] Interrompendo plano '${plan.id}' devido a erro não recuperável em '${step.id}'.`);
        plan.status = "failed";
        return plan;
      }
    }

    plan.status = "completed";
    return plan;
  }
}

export const dagPlannerEngine = new DAGPlannerEngine();
