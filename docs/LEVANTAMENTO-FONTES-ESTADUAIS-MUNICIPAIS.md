# Fontes estaduais e municipais: levantamento antes da extração

Outubro de 2026 · para o Atlas 2.0 (Brasil) e o Atlas Metropolitano RMPA (3.9)

Este levantamento vem **antes** de qualquer extração. Ele procura dados que não vêm do IBGE, da
PNAD nem do IPEA, sobretudo em sites de estados e municípios. Para cada fonte, ele diz:

- o que ela mede;
- em que nível geográfico e para quais anos;
- se foi possível abrir o arquivo e conferir o conteúdo;
- o que ela acrescentaria a cada atlas;
- como ela entraria no HTML.

A regra é a mesma do resto do trabalho: nada é estimado nem completado. O que a fonte não traz fica
sem dado, com aviso.

## 1. O que foi possível conferir daqui

A política de rede deste ambiente de trabalho recusou **todos os 52 endereços testados** (o proxy
respondeu 403). Entram nessa conta:

- secretarias de segurança;
- institutos estaduais de estatística;
- portais municipais de dados abertos;
- órgãos federais fora do IBGE.

Nenhum arquivo foi baixado deles, e nenhum valor deste documento saiu deles. Os domínios estão nas
tabelas da seção 3 e na seção 6.

O único acervo com esse tipo de dado que abre daqui é o **espelho público da Base dos Dados**
(`storage.googleapis.com/basedosdados-public`). O Atlas 2.0 já usa esse espelho, que republica
algumas bases estaduais e municipais. Só os arquivos gratuitos foram baixados, nunca os `_bdpro`.
Cada tabela foi aberta para conferir colunas, anos, municípios cobertos, meses vazios e totais.

- A **seção 2** traz o que foi conferido.
- A **seção 3** lista o que não pôde ser aberto. Ali, a descrição é a do que cada órgão costuma
  publicar. O conteúdo atual precisa ser conferido no arquivo quando o acesso for liberado.

## 2. Conferido nesta sessão

| Fonte original | O que mede | Nível | Período na cópia | Situação |
|---|---|---|---|---|
| **ISP-RJ**: Instituto de Segurança Pública, com base nos registros de ocorrência da Polícia Civil do RJ | 53 contagens mensais, entre elas: homicídio doloso, CVLI, letalidade violenta, mortes por intervenção de agente do Estado, roubos e furtos por tipo, estupro, pessoas desaparecidas | município (92 de 92) e área de delegacia (CISP; 137 áreas em 2023) | 2014 a jun/2024 por município; 2003 a jun/2024 por CISP | **Usável.** Ver a nota 1 abaixo. |
| **SSP-SP**: Secretaria da Segurança Pública de São Paulo | 23 tipos de ocorrência (homicídio doloso e vítimas, latrocínio, estupro, roubos, furtos) e 13 de produtividade policial | município (645 de 645) | jan/2002 a ago/2021 | **Usável até 2020.** Ver a nota 2 abaixo. |
| **IPP-Rio**: Instituto Pereira Passos, da Prefeitura do Rio | Índice de Progresso Social: nota geral, 3 dimensões, 12 componentes e 36 indicadores (mortalidade, saneamento, homicídios, qualidade do ensino, internet, gravidez na adolescência e outros) | 32 Regiões Administrativas e a cidade | 2016, 2018 e 2020 | **Usável com uma condição.** Ver a nota 3 abaixo. |
| **SEDUC-SP**: Secretaria da Educação de São Paulo | fluxo escolar (aprovação, reprovação, abandono), IDESP e nível socioeconômico das escolas estaduais | município e escola | fluxo de 2011 a 2019; IDESP de 2007 a 2019 | **Pouco ganho.** É antigo e se sobrepõe ao IDEB 2023, que o Atlas 2.0 já tem. |
| **INPE PRODES** (federal, fora do IBGE) | área desmatada, vegetação natural e hidrografia | município e bioma | 2000 a 2022 | **Reprovado na conferência.** Ver a nota 4 abaixo. |
| ITDP Mobilidados | motorização; população perto de transporte de média e alta capacidade | capitais | até 2018 e 2019 | Pouco ganho. |
| SIM (Ministério da Saúde), tabela municipal da cópia | total de óbitos | município | 1996 a 2019 | Pouco ganho: não separa as causas de morte. |

**Nota 1, ISP-RJ.**

- Totais do estado em 2023: 3.399 CVLI e 4.270 casos de letalidade violenta. A capital teve 1.438
  casos de letalidade violenta.
- A tabela de taxas anuais da cópia está quase vazia: 639 de 644 linhas não têm valor. A taxa por
  100 mil seria um cálculo do Atlas, a partir das contagens.
- A cópia tem dois erros, que a extração precisa tratar:
  - a 109ª delegacia (Sapucaia) aparece com o código de um município de outro estado;
  - 258 linhas por CISP têm o município "9999999".

**Nota 2, SSP-SP.**

- Na cópia, setembro a dezembro de 2021 estão vazios.
- Por isso, o total de 2021 (1.936 vítimas de homicídio doloso) não se compara com o de 2020
  (3.038). O último ano completo é 2020.

**Nota 3, IPP-Rio.**

- Falta a tabela oficial que diz a qual RA pertence cada bairro do IBGE. Ela está no data.rio, que
  está bloqueado.
- Montar essa tabela de memória seria inventar. Sem ela, o IPS só pode ser desenhado se houver os
  limites das RAs.

**Nota 4, INPE PRODES.**

- 2.736 linhas, de 122 municípios, têm vegetação natural negativa.
- Outras 1.150 linhas têm área total zero.
- Só deve entrar a partir da base original do INPE (TerraBrasilis, bloqueado daqui).

Algumas bases estão no espelho gratuito só com o dicionário, sem os dados:

- o cadastro do IPTU de Belo Horizonte;
- as despesas e licitações municipais coletadas dos Tribunais de Contas (MiDES, do Banco Mundial);
- SINASC, RAIS, CAGED, CNPJ, SISVAN e Comex.

### 2.1 Teste: crimes por bairro no Rio de Janeiro e em Niterói

O ISP descreve cada área de delegacia (CISP) pela lista de bairros que ela cobre. O teste comparou
essas listas com os bairros do Censo 2022 que o Atlas 2.0 já desenha.

**Rio de Janeiro**

- Há 41 delegacias e 162 bairros do IBGE. Desses, 148 casam pelo nome.
- Alguns bairros são divididos entre delegacias: Centro (1ª, 4ª, 5ª e 6ª DP), Copacabana, Tijuca,
  Penha Circular, Água Santa e outros.
- As delegacias que dividem algum bairro foram juntadas numa unidade só. Assim, a soma das
  ocorrências de cada unidade corresponde exatamente a um conjunto de bairros inteiros. O resultado
  são **30 unidades**.
- Ficam quatro pendências:
  - o Méier aparece só como "(parte)", na 23ª DP, e a outra parte não está em nenhuma lista;
  - Complexo do Alemão não aparece em nenhuma lista;
  - Vila Kennedy também não aparece em nenhuma lista;
  - "Freguesia", na lista da 37ª DP (Ilha do Governador), deve ser a "Freguesia (Ilha do
    Governador)" do IBGE. Isso precisa ser confirmado.

**Niterói**

- Há 5 delegacias e 52 bairros. Desses, 47 casam pelo nome.
- Há duas diferenças de grafia: "Ponta da Areia" × "Ponta D'Areia" e "Cachoeiras" × "Cachoeira".
- Três bairros não estão em nenhuma lista: Maravista, Santo Antônio e Serra Grande.

**Outros municípios.** Em São Gonçalo, Duque de Caxias e Nova Iguaçu, o ISP descreve as áreas por
distrito, e não por bairro. Lá o teste não se aplica.

**Conclusão.** No Rio e em Niterói dá para mostrar crimes no nível do bairro. A unidade seria a área
de delegacia desenhada com os bairros do IBGE. Os bairros pendentes ficam sem dado. O mapa oficial
das CISPs, que o ISP publica, resolveria as pendências sem depender dos nomes, mas está bloqueado
daqui.

## 3. Fontes que não puderam ser abertas daqui

O conteúdo descrito abaixo é o que cada órgão costuma publicar. **Ele não foi conferido nesta
sessão.** Antes de qualquer extração, o arquivo será conferido como na seção 2: anos, formato e
cobertura.

### 3.1 Segurança pública: secretarias e polícias estaduais

| Órgão | O que costuma publicar | Domínio |
|---|---|---|
| SSP/RS | indicadores criminais por município, mensais e anuais (ver a nota abaixo) | ssp.rs.gov.br |
| SSP-SP | a mesma série da seção 2, atualizada, também por delegacia | ssp.sp.gov.br |
| ISP-RJ | a série da seção 2 atualizada e o mapa das CISPs | isp.rj.gov.br, ispdados.rj.gov.br |
| SEJUSP-MG | crimes violentos por município (dados abertos) | seguranca.mg.gov.br |
| SDS-PE | CVLI por município | sds.pe.gov.br |
| SSPDS-CE | CVLI por município | sspds.ce.gov.br |
| SESP-PR | relatórios estatísticos por município | seguranca.pr.gov.br |
| SSP-SC | painel "Segurança em números" | ssp.sc.gov.br |
| SSP-DF | ocorrências por Região Administrativa | ssp.df.gov.br |
| SESP-ES e SSP-BA | estatísticas estaduais | sesp.es.gov.br, ssp.ba.gov.br |
| MJSP/SINESP (federal) | base municipal de vítimas de homicídio e de outros crimes, enviada pelas secretarias de todas as UFs | gov.br, dados.mj.gov.br |

**Nota sobre a SSP/RS.** O arquivo de 2025 usado na versão 3 da RMPA traz uma linha por município.
A versão 3 lê só os sete da RMPA.

**Cuidado de método.** Cada estado classifica e registra as ocorrências do seu jeito. Por isso:

- o mapa de segurança deve comparar municípios **dentro da mesma UF**, com legenda e ranking por UF
  e com aviso;
- a base do SINESP é a única que permitiria comparar UFs, e ainda assim com ressalva;
- para homicídios no país todo, a alternativa comparável é o SIM (seção 3.4). Ele conta óbitos por
  causa, e não registros policiais.

### 3.2 Índices estaduais de desenvolvimento municipal

| Órgão | Índice | Nível | Domínio |
|---|---|---|---|
| DEE/SPGG-RS (antiga FEE) | IDESE: educação, renda e saúde | município do RS, anual | dee.rs.gov.br |
| Fundação SEADE (SP) | IPRS (riqueza, longevidade e escolaridade) e IPVS (vulnerabilidade) | município; o IPVS é por setor censitário | seade.gov.br |
| Fundação João Pinheiro (MG) | IMRS: centenas de indicadores municipais | município de MG | fjp.mg.gov.br |
| IPARDES (PR) | IPDM: Índice Ipardes de Desempenho Municipal | município do PR | ipardes.pr.gov.br |
| IPECE (CE) | IDM: Índice de Desenvolvimento Municipal | município do CE | ipece.ce.gov.br |
| IPEDF (DF) | PDAD: pesquisa domiciliar do DF | Região Administrativa | ipe.df.gov.br |
| SEI-BA, IJSN-ES, IMB-GO e CEPERJ-RJ | anuários e perfis municipais | município | sei.ba.gov.br, ijsn.es.gov.br, imb.go.gov.br, ceperj.rj.gov.br |

Esses índices são mais recentes que o IDHM de 2010, que é o índice de desenvolvimento que o Atlas
tem hoje. Cada um tem método próprio, então só se comparam dentro do estado. O IPVS é por setor
censitário. Por isso, ele poderia ir para os bairros de SP pelo mesmo caminho que o Atlas 2.0 já
usa com o Censo.

### 3.3 Portais municipais: nível de bairro

| Prefeitura | O que interessa | Domínio |
|---|---|---|
| Porto Alegre | acidentes de trânsito com coordenadas (EPTC), equipamentos públicos, indicadores por bairro | dadosabertos.poa.br |
| Rio de Janeiro (IPP) | a tabela de bairros por RA (necessária para o IPS da seção 2) e indicadores por bairro | data.rio |
| São Paulo | indicadores por distrito e subprefeitura; GeoSampa | dados.prefeitura.sp.gov.br, geosampa.prefeitura.sp.gov.br |
| Belo Horizonte | IQVU por unidade de planejamento | dados.pbh.gov.br |
| Recife e Fortaleza | portais de dados abertos | dados.recife.pe.gov.br, dados.fortaleza.ce.gov.br |

Cada prefeitura usa sua própria divisão do território: distritos, unidades de planejamento, RAs.

- Quando essas unidades são uniões de bairros inteiros, o dado entra exato nos bairros do IBGE,
  como no teste da seção 2.1.
- Quando não são, o dado fica na unidade da prefeitura, desenhada à parte.

### 3.4 Federais fora do IBGE

Estas bases não são estaduais nem municipais, mas também estão fora do padrão IBGE/PNAD/IPEA. São as
que mais renovariam os temas em que o Atlas 2.0 hoje depende de 2010.

| Base | O que traz | Lacuna que fecha |
|---|---|---|
| Cadastro Único e Bolsa Família (MDS) | famílias em pobreza e em extrema pobreza, por município e por mês | renda e pobreza (hoje, 2010) |
| RAIS e Novo CAGED (MTE) | emprego formal, salário médio e saldo de vagas, por município | trabalho (hoje, 2010) |
| SIM e SINASC (Ministério da Saúde) | mortalidade infantil, baixo peso ao nascer, pré-natal, mães adolescentes, homicídios por causa de óbito | saúde (hoje, 2010) e violência comparável entre UFs |
| SICONFI (Tesouro) | receitas e despesas municipais; a versão 3 já busca pelo navegador para a RMPA | finanças municipais no país todo |
| SENATRAN, Banco Central e ANEEL | frota de veículos; agências bancárias e Pix por município; geração solar distribuída | sinais de consumo e renda |
| INPE (TerraBrasilis) | PRODES original | ambiente; a cópia foi reprovada (seção 2) |

## 4. O que cada fonte acrescentaria

### Atlas 2.0 (Brasil)

**Nova categoria "Segurança".** Hoje o Atlas 2.0 não tem nenhum indicador de segurança.

- Já é possível fazer:
  - RJ por município, de 2014 a 2023;
  - RJ por área de delegacia, no Rio e em Niterói;
  - SP por município, de 2002 a 2020.
- Com acesso, entrariam:
  - RS, MG, PE, CE, PR, SC e DF;
  - a base nacional do SINESP.
- As UFs sem fonte ficam "sem dado".

**Renovar os temas que hoje dependem de 2010.** São pobreza, trabalho, mortalidade infantil e
desenvolvimento humano. Isso viria pelas bases federais da seção 3.4 e pelos índices estaduais da
seção 3.2.

**Mais detalhe dentro das cidades:**

- o IPS por Região Administrativa no Rio;
- o IPVS em São Paulo;
- a PDAD no Distrito Federal;
- as áreas de delegacia no Rio e em Niterói.

### Atlas RMPA (3.9)

- **SSP/RS.** A versão 3 tem o ano de 2025 para os sete municípios. A série dos anos anteriores
  mostraria a tendência.
- **IDESE.** É um índice anual para os sete municípios, para ler ao lado do IDHM de 2010.
- **Dados abertos de Porto Alegre.** Acidentes de trânsito por bairro.
- A mancha da enchente de 2024 (IPH/UFRGS) já está na versão 3.

## 5. Como os dados entram no HTML

**Embutidos (recomendado).**

- A extração roda do nosso lado, com as conferências da seção 2.
- O resultado vai para `atlas2/dados/*.js` e para o arquivo único `atlas2-brasil.html`. Na RMPA, vai
  para `atlas_v3/dados/` e para `atlas-rmpa.html`.
- Quem usa só abre o HTML. Não precisa de Python, de R nem de internet para os dados.

**Busca ao vivo pelo navegador.**

- Só funciona quando o servidor da fonte permite. O SICONFI permite, e a versão 3 já o usa assim.
- Os sites das secretarias em geral não permitem, por isso essa não deve ser a via principal.

**Atualização sem comandos (opcional).**

- Funciona como a central da versão 3: a pessoa baixa a planilha oficial no site da secretaria e
  arrasta no Atlas. O Atlas lê o arquivo no próprio navegador.
- Serve para séries mensais, como as da SSP.
- Para isso, é preciso ver um exemplo de cada arquivo antes, para conhecer o formato.

**Como apareceria no Atlas:**

- uma categoria nova, com legenda e ranking por UF;
- a ficha do município com a fonte, o período e a nota "comparar só dentro da UF";
- a taxa por 100 mil identificada como cálculo do Atlas: a contagem da secretaria dividida pela
  população do Censo 2022;
- meses ou anos parciais marcados como parciais, como janeiro a junho de 2024 no ISP.

## 6. O que destrava a seção 3

Há dois caminhos.

**1. Liberar os domínios na rede do ambiente de trabalho.**

- Caminho: menu do ambiente na barra de título da sessão → *Edit* → *Network access*. Escolha um
  nível mais amplo ou adicione os domínios em *Allowed domains*.
- Os domínios de cada fonte estão nas tabelas da seção 3:
  - secretarias e institutos estaduais: `ssp.rs.gov.br`, `dee.rs.gov.br`, `ssp.sp.gov.br`,
    `seade.gov.br`, `isp.rj.gov.br`, `fjp.mg.gov.br`, `ipardes.pr.gov.br` e os demais;
  - órgãos federais: `gov.br`, `saude.gov.br`, `bcb.gov.br`, `tesouro.gov.br` e os demais;
  - prefeituras: `dadosabertos.poa.br`, `data.rio`, `dados.prefeitura.sp.gov.br` e os demais.
- Instruções: <https://code.claude.com/docs/en/cloud-environments#network-access>

**2. Baixar os arquivos oficiais e anexá-los na conversa.** O arquivo é conferido, extraído e
embutido como os outros.

## 7. Proposta de ordem, para validar antes de extrair

1. **Segurança no RJ (ISP).** Já pode ser feita: municípios de 2014 a 2023, com janeiro a junho de
   2024 marcados como parciais, e áreas de delegacia no Rio e em Niterói.
2. **Segurança em SP (SSP-SP).** Também já pode ser feita: municípios de 2002 a 2020. Com acesso ao
   site, entram os anos seguintes.
3. **Segurança no RS (SSP/RS).** Depende do acesso ou do arquivo. Entram os municípios do RS no
   Atlas 2.0 e a série da RMPA.
4. **Bases federais fora do IBGE**: Cadastro Único, RAIS/CAGED e SIM/SINASC. Dependem do acesso. São
   o maior ganho para o Atlas nacional.
5. **Índices estaduais**: IDESE, IPRS/IPVS, IMRS, IPDM e IDM. Dependem do acesso.

**Ficam de fora:**

- a cópia do PRODES, por inconsistência;
- SEDUC-SP, Mobilidados e a tabela municipal do SIM, por serem antigos ou repetirem o que o Atlas
  já tem;
- o IPS do Rio, até haver a tabela de bairros por RA.

## Anexo: tabelas conferidas no espelho da Base dos Dados

Os arquivos estão em `storage.googleapis.com/basedosdados-public/one-click-download/`, sempre na
versão gratuita (sem `_bdpro`):

- `br_rj_isp_estatisticas_seguranca/`:
  - `evolucao_mensal_municipio`;
  - `taxa_evolucao_mensal_municipio`;
  - `taxa_evolucao_anual_municipio`;
  - `evolucao_mensal_cisp`;
  - `relacao_cisp_aisp_risp`;
  - `taxa_letalidade`.
- `br_sp_gov_ssp/`: `ocorrencias_registradas` e `produtividade_policial`.
- `br_rj_rio_de_janeiro_ipp_ips/`: `indicadores` e `dimensoes_componentes`.
- `br_sp_seduc_fluxo_escolar/municipio`, `br_sp_seduc_idesp/escola` e `br_sp_seduc_inse/escola`.
- `br_inpe_prodes/municipio_bioma`.
- `br_ms_sim/municipio`.
- `br_mobilidados_indicadores/`: `taxa_motorizacao` e `proporcao_pessoas_proximas_pnt`.
- Só o dicionário:
  - `br_mg_belohorizonte_smfa_iptu`;
  - `world_wb_mides`;
  - `br_ms_sinasc`, `br_me_rais`, `br_me_caged`, `br_me_cnpj`, `br_ms_sisvan` e `br_me_comex_stat`.

Os bairros do teste da seção 2.1 são os de `atlas2/dados/regiao-se.js`, gerados a partir dos setores
do Censo 2022.
