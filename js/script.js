
var URL_PLANILHA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSiUuMvXnjXQahrxDYsgX6uotdYhsWwagbTrz4sWCpSjpTFqAI1cMf9EmjN2K9ao4xa_XFmfPWNNVuS/pub?output=csv";

function lerCSV(texto) {

    var linhas = [];
    var linha = [];
    var valor = "";
    var aspas = false;

    for (var i = 0; i < texto.length; i++) {

        var caractere = texto[i];
        if (caractere == '"') {
            if (aspas && texto[i + 1] == '"') {
                valor += '"';
                i++;
            } else {
                aspas = !aspas;
            }

        } else if (caractere == ',' && !aspas) {
            linha.push(valor);
            valor = "";

        } else if ((caractere == '\n' || caractere == '\r') && !aspas) {
            if (caractere == '\r' && texto[i + 1] == '\n') {
                i++;
            }

            linha.push(valor);
            if (linha.some(function(item) {
                return item.trim() != "";
            })) {
                linhas.push(linha);
            }

            linha = [];
            valor = "";

        } else {
            valor += caractere;
        }
    }

    linha.push(valor);
    if (linha.some(function(item) {
        return item.trim() != "";
    })) {
        linhas.push(linha);
    }

    return linhas;
}

function formatarData(data) {
    var partes = data.split("-");
    if (partes.length != 3) {
        return data;
    }

    var dia = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );

    return dia.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long"
    });
}

function criarLink(texto, url) {
    if (!url) {
        return;
    }

    try {
        var endereco = new URL(url);
        if (endereco.protocol != "https:" &&
            endereco.protocol != "http:") {
            return;
        }
        var link = document.createElement("a");

        link.href = endereco.href;
        link.textContent = texto;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        return link;

    } catch (erro) {
        return;
    }
}

function carregarAtividades(atividades) {
    var area = document.getElementById("atividades");
    var total = document.getElementById("total");
    area.innerHTML = "";

    atividades.sort(function(a, b) {
        return a.data.localeCompare(b.data) ||
               a.inicio.localeCompare(b.inicio);
    });

    total.textContent = atividades.length + " atividades";
    if (atividades.length == 0) {
        area.textContent = "Nenhuma atividade cadastrada.";
        return;
    }

    var dataAtual = "";
    atividades.forEach(function(atividade) {

        if (atividade.data != dataAtual) {
            dataAtual = atividade.data;

            var grupo = document.createElement("div");
            grupo.className = "grupo-dia";

            var tituloDia = document.createElement("h3");
            tituloDia.textContent = formatarData(dataAtual);
            grupo.appendChild(tituloDia);
            area.appendChild(grupo);
        }

        var card = document.createElement("div");
        card.className = "atividade";

        var horario = document.createElement("p");
        horario.className = "data";

        horario.textContent =
            atividade.inicio + " - " + atividade.fim;

        var titulo = document.createElement("h4");
        titulo.textContent = atividade.titulo;

        var descricao = document.createElement("p");
        descricao.className = "descricao";
        descricao.textContent = atividade.descricao;

        var links = document.createElement("div");
        links.className = "links";

        var material = criarLink(
            "Acessar material ↗",
            atividade.link
        );

        var gravacao = criarLink(
            "Assistir gravação ↗",
            atividade.gravacao
        );

        if (material) {
            links.appendChild(material);
        }

        if (gravacao) {
            links.appendChild(gravacao);
        }

        if (!gravacao) {

            var aviso = document.createElement("span");
            aviso.className = "sem-gravacao";
            aviso.textContent = "Gravação ainda não disponível";
            links.appendChild(aviso);
        }

        card.appendChild(horario);
        card.appendChild(titulo);
        card.appendChild(descricao);
        card.appendChild(links);
        area.lastElementChild.appendChild(card);

    });
}


function buscarPlanilha() {
    var area = document.getElementById("atividades");
    area.textContent = "Carregando atividades...";

    fetch(URL_PLANILHA)
        .then(function(resposta) {
            if (!resposta.ok) {
                throw new Error("Não foi possível acessar a planilha.");
            }
            return resposta.text();
        })

        .then(function(texto) {
            var linhas = lerCSV(texto);
            if (linhas.length < 2) {
                carregarAtividades([]);
                return;
            }

            var cabecalho = linhas[0].map(function(item) {
                return item.trim().toLowerCase();
            });
            cabecalho[0] = cabecalho[0].replace(/^\uFEFF/, "");

            var atividades = [];
            for (var i = 1; i < linhas.length; i++) {

                var objeto = {};
                cabecalho.forEach(function(coluna, indice) {
                    objeto[coluna] = (linhas[i][indice] || "").trim();
                });

                if (objeto.data && objeto.titulo) {
                    atividades.push(objeto);
                }
            }

            carregarAtividades(atividades);
        })

        .catch(function(erro) {
            console.log(erro);

            area.textContent =
                "Não foi possível carregar a agenda. Tente novamente mais tarde.";

            document.getElementById("total").textContent =
                "Erro ao carregar";

        });
}

buscarPlanilha();
