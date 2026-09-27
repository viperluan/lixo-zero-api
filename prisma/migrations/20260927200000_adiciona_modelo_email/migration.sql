-- CreateTable
CREATE TABLE "ModeloEmail" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "assunto" TEXT NOT NULL,
    "conteudo" JSONB NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "id_usuario" TEXT,

    CONSTRAINT "ModeloEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModeloEmail_codigo_key" ON "ModeloEmail"("codigo");

-- CreateIndex
CREATE INDEX "ModeloEmail_id_usuario_idx" ON "ModeloEmail"("id_usuario");

-- AddForeignKey
ALTER TABLE "ModeloEmail" ADD CONSTRAINT "ModeloEmail_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed dos textos atuais dos três e-mails da ação
INSERT INTO "ModeloEmail" ("id", "codigo", "assunto", "conteudo", "atualizado_em")
VALUES
(
    gen_random_uuid(),
    'acao_cadastrada',
    'CaxiasLixoZero {ano} - Cadastro da ação: {titulo_acao}',
    $json${"paragrafos_abertura":"Muito obrigado por ter se inscrito na 6ª Semana Lixo Zero de Caxias do Sul!\nEstamos muito felizes com a sua participação! :)\nVamos te passar algumas informações super importantes aqui. Por favor, leia com atenção para que possamos confirmar a sua inscrição!","faixa":"Sua inscrição foi cadastrada e assim que nossa equipe aprovar, você receberá um email informando sobre!","texto_antes_ficha":"Antes de prosseguir, gostaríamos de confirmar as informações que você cadastrou em nosso formulário:","rotulo_botao":"Templates para ações - SLZ 2026","url_pasta":"https://drive.google.com/drive/folders/12qTWAQrkjjoVl9CW72rNawOKY21q6Byo","texto_depois_botao":"Quanto antes você começar a divulgar seu evento, melhor!","convite_redes":"Ah, não esquece de marcar a gente para que possamos encontrar o seu post e compartilhar nas nossas redes também!","hashtags":"@caxiaslixozero\n#semanalixozerocaxias\n#slzcxs"}$json$::jsonb,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    'acao_aprovada',
    'CaxiasLixoZero {ano} - Informação de ação aprovada!',
    $json${"faixa":"Gostariamos de informar que sua ação foi aprovada! Parabéns!","paragrafo_cards":"Temos alguns cards e templates prontos para você divulgar a sua ação! Eles servem para ajudar na identificação das ações que fazem parte da Semana Lixo Zero e você pode editá-los para incluir as informações da sua atividade!","rotulo_botao":"Templates para ações - SLZ 2026","url_pasta":"https://drive.google.com/drive/folders/12qTWAQrkjjoVl9CW72rNawOKY21q6Byo","texto_depois_botao":"Quanto antes você começar a divulgar seu evento, melhor!","paragrafo_redes":"Ah, não esquece de marcar a gente para que possamos encontrar o seu post e compartilhar nas nossas redes também!","hashtags":"@caxiaslixozero\n#semanalixozerocaxias\n#slzcxs\n#TransformandoIdeiasEmAções"}$json$::jsonb,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    'acao_reprovada',
    'CaxiasLixoZero {ano} - Informação de ação reprovada!',
    $json${"faixa":"Gostaríamos de informar que sua ação foi reprovada!","corpo":"Agradecemos o seu interesse. Qualquer dúvida estamos à disposição!"}$json$::jsonb,
    CURRENT_TIMESTAMP
);
