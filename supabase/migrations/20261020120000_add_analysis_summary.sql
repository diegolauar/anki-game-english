-- A seção 5.3 do CLAUDE.md define summary.main_points e summary.recommended_expressions
-- na saída do agente de análise, mas a tabela analyses não tinha onde persistir isso.
-- Sem esta coluna o resumo se perderia depois da primeira renderização da tela de resultados.
alter table analyses add column summary jsonb;
