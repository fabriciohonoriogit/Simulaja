import { z } from "zod";

export const SimulacaoSchema = z.object({
  valor_credito: z.number().min(0, "Valor do crédito deve ser maior que zero"),
  tipo: z.enum(["IMÓVEL", "MOTO", "VEÍCULO", "PESADOS", "SERVIÇOS", "imovel", "veiculo", "pesados", "servicos"]),
  com_seguro: z.boolean().default(true),
  meses: z.number().min(1, "O prazo mínimo deve ser maior que zero"),
  grupo: z.string().min(1, "Grupo não pode ser vazio"),
  taxa_adm: z.number().min(0, "Taxa de administração inválida"),
  fundo_reserva: z.number().min(0, "Fundo de reserva inválido"),
  parcela: z.number().min(0, "O valor da parcela deve ser maior que zero"),
});

export type SimulacaoData = z.infer<typeof SimulacaoSchema>;

export const ValidarSimulacaoParamsSchema = z.object({
  valorDesejado: z.number(),
  categoriaId: z.string(),
  // podemos adicionar mais campos conforme a necessidade
});
