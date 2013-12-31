AppController = function() {
    this.actionIndex = function() {
        if (App.getConfig("versao_atual") != App.getVersao()) {
            dbSQL.migrate(function() {
                alert('migrate OK');
                App.setConfig("versao_atual", App.getVersao());
                App.execute('app/index');
            });
        }
        Conta.getTotaldeContas(function(totalContas) {
            if (totalContas > 0) {
                App.execute('conta/index');
            } else {
                App.execute('conta/detalhesConta?id=0');
            }
        });
    };

    this.actionNovoPagamento = function() {
        var oThis = this;
        App.changeView('index', 'Nova transação - Pagamento', function() {
            $('#dataTransacao').val(App.converteData(App.getCurrentDate(), 'yyyy-mm-dd', 'dd/mm/yyyy'));
            $('#valorTransacao').focus();
            oThis.carregarContas();
            oThis.carregarBeneficiarios();
            oThis.carregarCategorias();
            $('#btnSalvar').click(function() {
                var podeSalvar = true;
                if (!Util.validaCamposObrigatorios()) {
                    return false;
                }
                if (typeof $('#contas').find('.selecionado').attr('id_conta') == 'undefined') {
                    alert('Selecione a conta.');
                    podeSalvar = false;
                }
                if (!podeSalvar) {
                    return true;
                }
                oThis.adicionaTransacao({
                    data: $('#dataTransacao').val(),
                    valor: $('#valorTransacao').val(),
                    baneficiario: $('#beneficiario').val(),
                    categoria: $('#categoria').val(),
                    conta: $('#contas').find('.selecionado').attr('id_conta')
                })
            });
        });
    };

    // Funções privadas - Utilizada somente nesse controller (pelo menos deveria)
    this.carregarBeneficiarios = function() {
        var oBeneficiario = new Beneficiario();
        oBeneficiario.buscaPorRelevancia('', function(arrayBeneficiarios) {
            for (var i in arrayBeneficiarios) {
                var oResult = arrayBeneficiarios[i];
                $('#listaBeneficiarios').append("<li><a href=\"#\">" + oResult.DESCRICAO + "</a></li>")
            }
            $('#listaBeneficiarios a').click(function() {
                $('#beneficiario').val($(this).text());
                $(this).parent().parent().hide();
            });
        });
    };

    this.carregarCategorias = function() {
        var oCategoria = new Categoria();
        oCategoria.buscaPorRelevancia('', function(arrayCategorias) {
            for (var i in arrayCategorias) {
                var oResult = arrayCategorias[i];
                $('#listaCategorias').append("<li><a href=\"#\">" + oResult.DESCRICAO + "</a></li>")
            }
            $('#listaCategorias a').click(function() {
                $('#categoria').val($(this).text());
                $(this).parent().parent().hide();
            });
            
        });
    };

    this.carregarContas = function() {
        var oContas = new Conta();
        oContas.findAll('id>0', function(oContas) {
            $('#contas').html("");
            for (var i in oContas) {
                var oConta = oContas[i];
                $('#contas').append(ContaHelper.showLinhaContaLi(oConta));
            }
            $('#contas').find('a').click(function() {
                $(this).parent().parent().children('li').each(function() {
                    $(this).removeClass('selecionado');
                });
                $(this).parent().addClass('selecionado');
            });
        });

    };

    this.adicionaTransacao = function(jDados) {
        Beneficiario.getId(jDados.baneficiario, function(idBeneficiario) {
            Categoria.getId(jDados.categoria, function(idCategoria) {
                var oTransacao = new Transacao();
                oTransacao.data = jDados.data;
                oTransacao.valor = jDados.valor;
                oTransacao.id_beneficiario = idBeneficiario;
                oTransacao.id_categoria = idCategoria;
                oTransacao.id_conta = jDados.conta;
                oTransacao.save(function() {
                    Categoria.acrescentaNumeroTransacoes(idCategoria);
                    Beneficiario.acrescentaNumeroTransacoes(idBeneficiario, idCategoria);
                    Conta.atualizaSaldo(jDados.conta, jDados.valor);
                    alert('salvo com sucesso.');
                });
            });
        });
        App.debug(jDados);

    };

};