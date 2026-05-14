import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ==========================================
// 1. CONFIGURAÇÃO (SUPABASE)
// ==========================================
const supabaseUrl = 'https://zalhjrqnjfqqohcaeesb.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphbGhqcnFuamZxcW9oY2FlZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDY2ODQsImV4cCI6MjA4NTE4MjY4NH0.HVL5aUR4i1Vr3lmmal-9zP65oPuIcltyQrrVF9lhjC0';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- VARIÁVEIS GLOBAIS ---
let todasTransacoes = [];
let transacoesFiltradas = [];
let graficoInstancia = null;

let todosLembretes = [];     
let idEdicaoLembrete = null; 

let humorSelecionado = ''; 
let corHabitoSelecionada = '#3b82f6'; 
const modeloEscolhido = "models/gemini-2.5-flash";
// 🔴 A SUA CHAVE AQUI 🔴
    const GEMINI_API_KEY = window.GEMINI_API_KEY; 

// ==========================================
// MENU HAMBURGER (MOBILE)
// ==========================================
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

// Se os elementos existirem na página, adiciona os cliques
if (menuToggle && sidebar && overlay) {
    // Abrir o menu
    menuToggle.onclick = () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    };
    
    // Fechar no botão X
    closeSidebar.onclick = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };
    
    // Fechar ao clicar fora do menu (no fundo escuro)
    overlay.onclick = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };
}

// ==========================================
// UTILITÁRIOS GLOBAIS (MOEDA)
// ==========================================
window.desformatarMoeda = function(valorComMascara) {
    if (!valorComMascara) return 0;
    // Remove o R$, os pontos e troca a vírgula por ponto para a base de dados
    return Number(valorComMascara.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
};

// MÁSCARA AUTOMÁTICA PARA OS CAMPOS DE MOEDA
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('mascara-moeda')) {
        // Remove tudo o que não for número
        let valor = e.target.value.replace(/\D/g, ''); 
        
        if (valor === '') {
            e.target.value = '';
            return;
        }
        
        // Coloca 2 casas decimais, troca ponto por vírgula e adiciona os pontos de milhar
        valor = (Number(valor) / 100).toFixed(2);
        valor = valor.replace('.', ',');
        valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        
        // Adiciona o R$ no início
        e.target.value = 'R$ ' + valor;
    }
});

// ==========================================
// 2. INICIALIZAÇÃO E ROTEAMENTO
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Busca a sessão uma única vez
    const { data: { session } } = await supabase.auth.getSession();

    const path = window.location.pathname;
    const isInPagesFolder = path.includes('/pages/');
    const homePath = isInPagesFolder ? '../index.html' : 'index.html';

    // Definição das rotas
    const isFinancas = path.includes('financas.html');
    const isLembretes = path.includes('lembretes.html');
    const isDiario = path.includes('diario.html');
    const isHabitos = path.includes('habitos.html');
    const isProjetos = path.includes('projetos.html');
    const isAnalise = path.includes('analise.html');
    const isIndex = !isInPagesFolder || path.endsWith('index.html');

    // --- LOGOUT GLOBAL (Configuração Segura) ---
    const btnLogout = document.getElementById('btnLogout'); 
    const btnLogoutSidebar = document.getElementById('logoutBtn');
    
    async function fazerLogout() {
        await supabase.auth.signOut();
        window.location.href = homePath;
    }
    if (btnLogout) btnLogout.onclick = fazerLogout;
    if (btnLogoutSidebar) btnLogoutSidebar.onclick = fazerLogout;

    // --- PROTEÇÃO DE ROTAS E INICIALIZAÇÃO DE MÓDULOS ---
    if (isFinancas || isLembretes || isDiario || isHabitos || isProjetos || isAnalise) {
        if (!session) {
            window.location.href = homePath;
            return;
        }
        // Inicializa o módulo específico da página
        if (isFinancas && typeof inicializarFinancas === 'function') inicializarFinancas();
        if (isLembretes && typeof inicializarLembretes === 'function') inicializarLembretes();
        if (isDiario && typeof inicializarDiario === 'function') inicializarDiario(); 
        if (isHabitos && typeof inicializarHabitos === 'function') inicializarHabitos(); 
        if (isProjetos && typeof inicializarProjetos === 'function') inicializarProjetos();
        if (isAnalise && typeof inicializarAnalise === 'function') inicializarAnalise();
    }

    // --- HOME (INDEX) ---
    if (isIndex) {
        const loginScreen = document.getElementById('login-screen');
        const appContent = document.getElementById('app-content');
        
        if (session) {
            if (loginScreen) loginScreen.style.setProperty('display', 'none', 'important');
            if (appContent) appContent.style.setProperty('display', 'flex', 'important');
            
            // Carrega os dados da home apenas se as funções existirem
            if (typeof carregarResumoHome === 'function') carregarResumoHome();
            if (typeof carregarContadorLembretesHome === 'function') carregarContadorLembretesHome(); 
            if (typeof carregarProgressoHabitosHome === 'function') carregarProgressoHabitosHome(); 
        } else {
            if (loginScreen) loginScreen.style.setProperty('display', 'flex', 'important');
            if (appContent) appContent.style.setProperty('display', 'none', 'important');
            if (typeof configurarLoginHome === 'function') configurarLoginHome();
        }
    }

    // Tenta iniciar o monitoramento se a função existir
    if (typeof iniciarMonitoramento === 'function') {
        iniciarMonitoramento();
    }
});

// ==========================================
// 3 - LÓGICA DE LOGIN E REGISTO REAL (SUPABASE)
// ==========================================
function configurarLoginHome() {
    const btnGoToRegister = document.getElementById('btnGoToRegister');
    const btnBackToLogin = document.getElementById('btnBackToLogin');
    const loginTitle = document.getElementById('login-title');
    const loginSubtitle = document.getElementById('login-subtitle');
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');

    // 1. Alternar entre "Entrar" e "Registar"
    if (btnGoToRegister) {
        btnGoToRegister.onclick = (e) => {
            e.preventDefault();
            loginTitle.innerText = "Criar Nova Conta";
            loginSubtitle.innerText = "Comece a organizar a sua vida hoje!";
            btnLogin.style.display = 'none';
            btnRegister.style.display = 'block';
            btnGoToRegister.style.display = 'none';
            btnBackToLogin.style.display = 'inline-block';
        };
    }

    if (btnBackToLogin) {
        btnBackToLogin.onclick = (e) => {
            e.preventDefault();
            loginTitle.innerText = "Bem-vindo de volta";
            loginSubtitle.innerText = "Acesse sua conta para continuar";
            btnLogin.style.display = 'block';
            btnRegister.style.display = 'none';
            btnGoToRegister.style.display = 'inline-block';
            btnBackToLogin.style.display = 'none';
        };
    }

    // 2. Login Real no Supabase
    if (btnLogin) {
        btnLogin.onclick = async (e) => {
            e.preventDefault(); 
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) return alert("Preencha todos os campos!");
            
            btnLogin.innerText = "Entrando..."; // Feedback visual

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                alert("Erro ao entrar: " + error.message);
                btnLogin.innerText = "Entrar";
            } else {
                window.location.reload(); // Recarrega a página para entrar no Dashboard
            }
        };
    }

    // 3. Registo Real no Supabase
    if (btnRegister) {
        btnRegister.onclick = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) return alert("Preencha todos os campos!");
            if (password.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");

            btnRegister.innerText = "Criando..."; // Feedback visual

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                alert("Erro ao criar conta: " + error.message);
                btnRegister.innerText = "Criar Conta";
            } else {
                alert("Conta criada com sucesso! Faça login para continuar.");
                btnBackToLogin.click(); // Volta automaticamente para o form de login
                btnRegister.innerText = "Criar Conta";
            }
        };
    }
}

// ==========================================
// 4. MÓDULO: RESUMO NA HOME E CARDS
// ==========================================
async function carregarResumoHome() {
    let user;
    
    // 1. Bloco de segurança para o Utilizador (Resolve o erro vermelho!)
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        user = data.user;
    } catch (erro) {
        console.warn("Aviso (Lock ignorado): Tentando pegar usuário via sessão...", erro.message);
        // PLANO B: Se o cofre estiver trancado, pega o crachá rápido da memória!
        const { data } = await supabase.auth.getSession();
        user = data?.session?.user;
    }

    if (!user) return;

    // 2. Bloco de segurança para as Transações
    try {
        const { data: transacoes, error } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', user.id);

        if (error) {
            console.error("Erro ao buscar transações no resumo:", error.message);
            return;
        }

        let receitas = 0;
        let despesas = 0;
        
        // Se houver transações, faz as contas
        if (transacoes) {
            transacoes.forEach(t => {
                if (t.type === 'income') receitas += t.amount;
                else despesas += t.amount;
            });
        }

        const saldo = receitas - despesas;
        const elSaldo = document.getElementById('saldoDisplay');
        const elRec = document.getElementById('receitasDisplay');
        const elDesp = document.getElementById('despesasDisplay');

        if (elSaldo) {
            elSaldo.innerText = formatarMoeda(saldo);
            elSaldo.style.color = saldo >= 0 ? '#10b981' : '#ef4444';
        }
        if (elRec) elRec.innerText = formatarMoeda(receitas);
        if (elDesp) elDesp.innerText = formatarMoeda(despesas);

    } catch (err) {
        console.error("Erro inesperado no carregarResumoHome:", err);
    }

    // ----------------------------------------------------
    // NOVO: Atualizar o contador de Projetos/Metas na Home
    // ----------------------------------------------------
    try {
        // Usamos { count: 'exact', head: true } para ser super rápido. 
        // Ele não baixa os dados, só pergunta ao banco "Quantos existem?"
        const { count, error: erroProjetos } = await supabase
            .from('financial_goals')
            .select('*', { count: 'exact', head: true }) 
            .eq('user_id', user.id);

        if (!erroProjetos) {
            const elContadorProjetos = document.getElementById('contador-projetos');
            if (elContadorProjetos) {
                elContadorProjetos.innerText = count || 0;
            }
        } else {
            console.error("Erro ao contar projetos:", erroProjetos);
        }
    } catch (err) {
        console.error("Erro inesperado ao buscar contador de projetos:", err);
    }
}

async function carregarProgressoHabitosHome() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: habitos, error: erroHabitos } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id);

    const numeroDisplay = document.querySelector('.module-card.habits .big-number');
    const textoDisplay = document.querySelector('.module-card.habits .sub-text');

    if (erroHabitos || !habitos || habitos.length === 0) {
        if(numeroDisplay) numeroDisplay.innerText = '0%';
        if(textoDisplay) textoDisplay.innerText = 'Progresso da semana';
        return;
    }

    const totalHabitos = habitos.length;
    const metasDaSemana = totalHabitos * 7; 

    const datasSemana = obterDatasDaSemanaAtual();
    const primeiroDiaSemana = datasSemana[0];
    const ultimoDiaSemana = datasSemana[6];

    const { data: logs, error: erroLogs } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('date', primeiroDiaSemana)
        .lte('date', ultimoDiaSemana);

    if (erroLogs) return;

    let checksFeitos = logs ? logs.length : 0;
    if (checksFeitos > metasDaSemana) checksFeitos = metasDaSemana;

    const porcentagem = Math.round((checksFeitos / metasDaSemana) * 100);
    
    if (numeroDisplay) {
        numeroDisplay.innerText = `${porcentagem}%`;
    }
    if (textoDisplay) {
        textoDisplay.innerText = 'Progresso da semana';
    }
}

// ==========================================
// 5. MÓDULO: FINANÇAS
// ==========================================
async function inicializarFinancas() {
    await carregarDadosFinancas();
    configurarBotoesFinancas(); 
    configurarAbas();
    configurarFiltros();
}

async function carregarDadosFinancas() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (!error) {
        todasTransacoes = data;
        aplicarFiltros();
    }
}

function configurarFiltros() {
    const inputBusca = document.getElementById('inputBusca');
    const inputInicio = document.getElementById('filtroDataInicio');
    const inputFim = document.getElementById('filtroDataFim');
    const btnExportar = document.getElementById('btnExportar');

    if(inputBusca) inputBusca.oninput = aplicarFiltros;
    if(inputInicio) inputInicio.onchange = aplicarFiltros;
    if(inputFim) inputFim.onchange = aplicarFiltros;
    if(btnExportar) btnExportar.onclick = exportarRelatorioCSV;
}

function aplicarFiltros() {
    const termo = document.getElementById('inputBusca')?.value.toLowerCase() || '';
    const dataInicio = document.getElementById('filtroDataInicio')?.value;
    const dataFim = document.getElementById('filtroDataFim')?.value;

    transacoesFiltradas = todasTransacoes.filter(t => {
        const dataTransacao = t.created_at.split('T')[0];
        const matchTexto = t.description.toLowerCase().includes(termo) || 
                           t.category.toLowerCase().includes(termo);
        let matchData = true;
        if (dataInicio && dataTransacao < dataInicio) matchData = false;
        if (dataFim && dataTransacao > dataFim) matchData = false;
        return matchTexto && matchData;
    });

    calcularTotaisFinancas(transacoesFiltradas);
    preencherListaFinancas(transacoesFiltradas);
    gerarGrafico(transacoesFiltradas);
}

function calcularTotaisFinancas(dados) {
    let receitas = 0; let despesas = 0;
    dados.forEach(t => {
        if (t.type === 'income') receitas += t.amount; else despesas += t.amount;
    });
    const saldo = receitas - despesas;
    
    const elRec = document.getElementById('detail-income');
    const elDesp = document.getElementById('detail-expense');
    const elSaldo = document.getElementById('detail-balance');

    if (elRec) elRec.innerText = formatarMoeda(receitas);
    if (elDesp) elDesp.innerText = formatarMoeda(despesas);
    if (elSaldo) elSaldo.innerText = formatarMoeda(saldo);
}

function preencherListaFinancas(listaDados) {
    const el = document.getElementById('lista-transacoes');
    if(!el) return;
    el.innerHTML = ''; 
    if (listaDados.length === 0) {
        el.innerHTML = '<p style="text-align:center; padding:20px; color:#94a3b8">Nenhuma movimentação.</p>';
        return;
    }
    listaDados.forEach(t => {
        const isEntrada = t.type === 'income';
        const item = document.createElement('div');
        item.className = 'trans-item';
        item.onclick = () => abrirModalEdicaoFinancas(t);
        item.innerHTML = `
            <div class="trans-icon ${t.type}">${isEntrada ? '💰' : '💸'}</div>
            <div class="trans-info">
                <strong>${t.description || 'Sem descrição'}</strong>
                <span>${t.category} • ${formatarData(t.created_at)}</span>
            </div>
            <div class="trans-amount ${isEntrada ? 'positive' : 'negative'}">
                ${isEntrada ? '+' : '-'} ${formatarMoeda(t.amount)}
            </div>
        `;
        el.appendChild(item);
    });
}

function configurarAbas() {
    const btnTransacoes = document.getElementById('tabBtnTransacoes');
    const btnGraficos = document.getElementById('tabBtnGraficos');
    const viewLista = document.getElementById('view-lista');
    const viewGrafico = document.getElementById('view-grafico');

    if (btnTransacoes && btnGraficos) {
        btnTransacoes.onclick = () => {
            viewLista.style.display = 'block'; viewGrafico.style.display = 'none';
            btnTransacoes.classList.add('active'); btnGraficos.classList.remove('active');
        };
        btnGraficos.onclick = () => {
            viewLista.style.display = 'none'; viewGrafico.style.display = 'block';
            btnGraficos.classList.add('active'); btnTransacoes.classList.remove('active');
        };
    }
}

function configurarBotoesFinancas() {
    const btnAdd = document.getElementById('btnAbrirModal'); 
    const modalAdd = document.getElementById('modalNovaTransacao');
    const formAdd = document.getElementById('formTransacao');
    const btnExpense = document.getElementById('btnToggleExpense');
    const btnIncome = document.getElementById('btnToggleIncome');
    const inputTipo = document.getElementById('novoTipo');

    if (btnAdd && modalAdd) {
        btnAdd.onclick = (e) => { e.preventDefault(); modalAdd.classList.add('active'); };
        modalAdd.querySelectorAll('.close-btn, .close-btn-action').forEach(b => {
            b.onclick = () => modalAdd.classList.remove('active');
        });
    }

    if (btnExpense && btnIncome) {
        btnExpense.onclick = () => { btnExpense.classList.add('active'); btnIncome.classList.remove('active'); inputTipo.value = 'expense'; };
        btnIncome.onclick = () => { btnIncome.classList.add('active'); btnExpense.classList.remove('active'); inputTipo.value = 'income'; };
    }

    if (formAdd) {
        formAdd.onsubmit = async (e) => {
            e.preventDefault();
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('transactions').insert({
                user_id: user.id,
                description: document.getElementById('novaDesc').value,
                amount: window.desformatarMoeda(document.getElementById('novoValor').value),
                type: document.getElementById('novoTipo').value,
                category: document.getElementById('novaCategoria').value,
                created_at: document.getElementById('novaData').value
            });
            if (!error) {
                modalAdd.classList.remove('active'); formAdd.reset(); carregarDadosFinancas();
            } else alert('Erro: ' + error.message);
        };
    }

    const modalEdit = document.getElementById('modalEditarTransacao');
    const formEdit = document.getElementById('formEditarTransacao');
    const btnExcluir = document.getElementById('btnExcluir');
    
    if (modalEdit) {
        const btnClose = document.getElementById('fecharModalEdicao');
        if(btnClose) btnClose.onclick = () => modalEdit.classList.remove('active');
    }
    if (formEdit) {
        formEdit.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('editId').value;
            const { error } = await supabase.from('transactions').update({
                description: document.getElementById('editDesc').value,
                amount: window.desformatarMoeda(document.getElementById('editValor').value),
                category: document.getElementById('editCategoria').value
            }).eq('id', id);
            if (!error) { modalEdit.classList.remove('active'); carregarDadosFinancas(); }
        };
    }
    if (btnExcluir) {
        btnExcluir.onclick = async () => {
            if(confirm("Excluir?")) {
                const id = document.getElementById('editId').value;
                const { error } = await supabase.from('transactions').delete().eq('id', id);
                if (!error) { modalEdit.classList.remove('active'); carregarDadosFinancas(); }
            }
        };
    }
}

function abrirModalEdicaoFinancas(t) {
    const modal = document.getElementById('modalEditarTransacao');
    if(!modal) return;
    document.getElementById('editId').value = t.id;
    document.getElementById('editDesc').value = t.description;
    
    // Formata o número ao abrir para edição
    document.getElementById('editValor').value = formatarMoeda(t.amount); 
    
    document.getElementById('editCategoria').value = t.category;
    modal.classList.add('active');
}

function gerarGrafico(dados) {
    const ctx = document.getElementById('graficoCategorias');
    if (!ctx) return;
    const categorias = {};
    let totalReceitas = 0; let totalDespesas = 0;

    dados.forEach(t => {
        if (t.type === 'income') totalReceitas += t.amount;
        else {
            const cat = t.category || 'Outros';
            if (!categorias[cat]) categorias[cat] = 0;
            categorias[cat] += t.amount;
            totalDespesas += t.amount;
        }
    });

    if (graficoInstancia) graficoInstancia.destroy();
    
    const labels = Object.keys(categorias);
    const valores = Object.values(categorias);
    const coresBase = ['#f97316', '#8b5cf6', '#3b82f6', '#ec4899', '#ef4444', '#eab308'];
    const sobra = totalReceitas - totalDespesas;
    if (sobra > 0) { labels.push('Livre (Sobra)'); valores.push(sobra); coresBase.push('#10b981'); }

    graficoInstancia = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: valores, backgroundColor: coresBase, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }
    });
}

function exportarRelatorioCSV() {
    if (transacoesFiltradas.length === 0) { alert("Sem dados."); return; }
    let csvContent = "data:text/csv;charset=utf-8,Data;Descricao;Categoria;Tipo;Valor\n";
    transacoesFiltradas.forEach(t => {
        const data = new Date(t.created_at).toLocaleDateString('pt-BR');
        const valor = t.amount.toFixed(2).replace('.', ',');
        csvContent += `${data};${t.description};${t.category};${t.type};${valor}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// 6. MÓDULO: LEMBRETES
// ==========================================
async function inicializarLembretes() {
    await carregarLembretes();
    configurarBotoesLembretes();
    configurarFiltrosLembretes();
}

async function carregarLembretes() {
    const { data: { user } } = await supabase.auth.getUser();
    const listaEl = document.getElementById('listaLembretes');
    if(!listaEl) return;
    
    listaEl.innerHTML = '<p style="text-align:center; color:#64748b">Carregando...</p>';

    const { data: dados, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

    if (error) {
        console.error(error);
        listaEl.innerHTML = '<p>Erro ao carregar.</p>';
        return;
    }
    
    todosLembretes = dados;
    renderizarListaLembretes(todosLembretes);
}

function renderizarListaLembretes(lista) {
    const listaEl = document.getElementById('listaLembretes');
    listaEl.innerHTML = '';

    if (!lista || lista.length === 0) {
        listaEl.innerHTML = `
            <div style="text-align:center; padding: 40px;">
                <h3 style="color: #cbd5e1">Nenhum lembrete aqui.</h3>
                <p style="color: #64748b">Tudo limpo! 😎</p>
            </div>`;
        return;
    }

    lista.forEach(task => {
        const dataObj = new Date(task.due_date);
        const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dataFormatada = dataObj.toLocaleDateString('pt-BR');
        
        const card = document.createElement('div');
        card.className = `reminder-card priority-${task.priority} ${task.is_completed ? 'completed' : ''}`;
        
        card.innerHTML = `
            <div class="check-area">
                <div class="custom-checkbox" onclick="toggleConcluirLembrete('${task.id}', ${!task.is_completed})">
                    ${task.is_completed ? '<i class="fas fa-check" style="color:white; font-size:12px"></i>' : ''}
                </div>
            </div>
            
            <div class="content-area" onclick="window.prepararEdicaoLembrete('${task.id}')" style="cursor: pointer;">
                <h3>${task.title}</h3>
                <p>${task.category} • ${dataFormatada} às ${horaFormatada}</p>
            </div>

            <div class="action-area">
                <span class="time-badge">${horaFormatada}</span>
                <button onclick="excluirLembrete('${task.id}')" style="background:none; border:none; color:#ef4444; margin-top:5px; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        listaEl.appendChild(card);
    });
}

function configurarFiltrosLembretes() {
    const chips = document.querySelectorAll('.filter-chip');
    
    chips.forEach(chip => {
        chip.onclick = () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const filtro = chip.getAttribute('data-filter');
            const hoje = new Date();
            hoje.setHours(0,0,0,0);

            let listaFiltrada = [];

            if (filtro === 'all') {
                listaFiltrada = todosLembretes;
            } else if (filtro === 'today') {
                listaFiltrada = todosLembretes.filter(l => {
                    const dataTarefa = new Date(l.due_date);
                    return dataTarefa.getDate() === hoje.getDate() &&
                           dataTarefa.getMonth() === hoje.getMonth() &&
                           dataTarefa.getFullYear() === hoje.getFullYear();
                });
            } else if (filtro === 'week') {
                const limite = new Date(hoje);
                limite.setDate(hoje.getDate() + 7);

                listaFiltrada = todosLembretes.filter(l => {
                    const dataTarefa = new Date(l.due_date);
                    dataTarefa.setHours(0,0,0,0); 
                    return dataTarefa >= hoje && dataTarefa <= limite;
                });
            } else if (filtro === 'pending') {
                listaFiltrada = todosLembretes.filter(l => !l.is_completed);
            } else if (filtro === 'completed') {
                listaFiltrada = todosLembretes.filter(l => l.is_completed);
            }

            renderizarListaLembretes(listaFiltrada);
        };
    });
}

function configurarBotoesLembretes() {
    const btnNovo = document.getElementById('btnNovoLembrete');
    const modal = document.getElementById('modalLembrete');
    const closeBtn = modal ? modal.querySelector('.close-btn') : null;
    const form = document.getElementById('formLembrete');

    if (btnNovo && modal) {
        btnNovo.onclick = () => {
            form.reset();
            idEdicaoLembrete = null; 
            
            const btnSubmit = form.querySelector('button[type="submit"]');
            if(btnSubmit) btnSubmit.innerText = "Salvar Lembrete";

            const agora = new Date();
            const localISODate = new Date(agora.getTime() - (agora.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            
            const campoData = document.getElementById('lembreteData');
            const campoHora = document.getElementById('lembreteHora');

            if(campoData) campoData.value = localISODate;
            if(campoHora) campoHora.value = agora.toTimeString().slice(0,5);
            
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
            idEdicaoLembrete = null;
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const btnSalvar = form.querySelector('button[type="submit"]');
            const txtOriginal = btnSalvar.innerText;
            btnSalvar.innerText = "Processando...";
            
            const { data: { user } } = await supabase.auth.getUser();

            const dataStr = document.getElementById('lembreteData').value;
            const horaStr = document.getElementById('lembreteHora').value;
            const dataCompleta = new Date(`${dataStr}T${horaStr}:00`).toISOString();

            const dadosLembrete = {
                title: document.getElementById('lembreteTitulo').value,
                description: document.getElementById('lembreteDesc').value,
                due_date: dataCompleta,
                priority: document.getElementById('lembretePrioridade').value,
                category: document.getElementById('lembreteCategoria').value
            };

            let error = null;

            if (idEdicaoLembrete) {
                const response = await supabase
                    .from('reminders')
                    .update(dadosLembrete)
                    .eq('id', idEdicaoLembrete);
                error = response.error;
            } else {
                dadosLembrete.user_id = user.id;
                dadosLembrete.notificado = false; 
                const response = await supabase
                    .from('reminders')
                    .insert(dadosLembrete);
                error = response.error;
            }

            if (!error) {
                closeBtn.click();
                carregarLembretes();
            } else {
                alert("Erro ao salvar: " + error.message);
            }
            btnSalvar.innerText = txtOriginal;
        };
    }
}

window.prepararEdicaoLembrete = function(id) {
    const lembrete = todosLembretes.find(l => String(l.id) === String(id));
    if (!lembrete) return;

    idEdicaoLembrete = lembrete.id;

    document.getElementById('lembreteTitulo').value = lembrete.title;
    document.getElementById('lembreteDesc').value = lembrete.description || '';
    document.getElementById('lembretePrioridade').value = lembrete.priority;
    document.getElementById('lembreteCategoria').value = lembrete.category;

    if(lembrete.due_date) {
        const dataObj = new Date(lembrete.due_date);
        const dataPart = dataObj.toISOString().split('T')[0];
        const horaPart = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        document.getElementById('lembreteData').value = dataPart;
        document.getElementById('lembreteHora').value = horaPart;
    }

    const modal = document.getElementById('modalLembrete');
    const btnSalvar = document.querySelector('#formLembrete button[type="submit"]');
    
    if(btnSalvar) btnSalvar.innerText = "Atualizar Lembrete 🔄";
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

window.toggleConcluirLembrete = async (id, novoStatus) => {
    const { error } = await supabase.from('reminders').update({ is_completed: novoStatus }).eq('id', id);
    if(!error) carregarLembretes(); 
};

window.excluirLembrete = async (id) => {
    if(confirm("Excluir este lembrete?")) {
        const { error } = await supabase.from('reminders').delete().eq('id', id);
        if(!error) carregarLembretes();
    }
};

// ==========================================
// 7. UTILITÁRIOS GERAIS
// ==========================================
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}
function formatarData(dataISO) {
    if(!dataISO) return '';
    return new Date(dataISO).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function obterDatasDaSemanaAtual() {
    const datas = [];
    const hoje = new Date();
    const domingo = new Date(hoje);
    domingo.setDate(hoje.getDate() - hoje.getDay());

    for (let i = 0; i < 7; i++) {
        const data = new Date(domingo);
        data.setDate(domingo.getDate() + i);
        const localDate = new Date(data.getTime() - (data.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        datas.push(localDate);
    }
    return datas;
}

// ==========================================
// 8. MONITORAMENTO DE NOTIFICAÇÕES E HOME
// ==========================================
function iniciarMonitoramento() {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
    setInterval(verificarLembretesAgora, 30000); 
}

function verificarLembretesAgora() {
    const agora = new Date();
    const horaAtual = agora.getHours();
    const minAtual = agora.getMinutes();
    const diaAtual = agora.getDate();

    todosLembretes.forEach(l => {
        if (l.is_completed || l.notificado) return;

        const dataLembrete = new Date(l.due_date);
        
        if (dataLembrete.getDate() === diaAtual && 
            dataLembrete.getHours() === horaAtual && 
            dataLembrete.getMinutes() === minAtual) {
                
            enviarNotificacao(l.title, l.description || "Hora da tarefa!");
            
            l.notificado = true; 
            supabase.from('reminders').update({ notificado: true }).eq('id', l.id).then();
        }
    });
}

function enviarNotificacao(titulo, corpo) {
    try { const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'); audio.play(); } catch(e){}
    
    if (Notification.permission === "granted") {
        new Notification(titulo, { body: corpo, icon: '../assets/img/favicon.ico' });
    } else {
        alert("⏰ " + titulo + "\n" + corpo);
    }
}

async function carregarContadorLembretesHome() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const agora = new Date();
    const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0).toISOString();
    const fimDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59).toISOString();

    const { count, error } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('due_date', inicioDia)
        .lte('due_date', fimDia)
        .eq('is_completed', false);

    if (error) {
        console.error("Erro contador:", error);
        return;
    }

    const numeroDisplay = document.querySelector('.module-card.reminders .big-number');
    if (numeroDisplay) {
        numeroDisplay.innerText = count || 0;
    }
}

// ==========================================
// 9. MÓDULO: DIÁRIO 📖 
// ==========================================
async function inicializarDiario() {
    configurarBotoesHumor();
    configurarSalvarDiario();
    await carregarDiario();
    
    const filtroInput = document.getElementById('filtroData');
    const btnLimpar = document.getElementById('btnLimparFiltro');

    if (filtroInput && btnLimpar) {
        filtroInput.addEventListener('change', (e) => {
            const dataEscolhida = e.target.value;
            if (dataEscolhida) {
                btnLimpar.style.display = 'block'; 
                carregarDiario(dataEscolhida);     
            }
        });

        btnLimpar.addEventListener('click', () => {
            filtroInput.value = '';             
            btnLimpar.style.display = 'none';   
            carregarDiario();                   
        });
    }
    
    const campoData = document.getElementById('diarioData');
    if (campoData) {
        campoData.value = new Date().toISOString().split('T')[0];
    }
}

function configurarBotoesHumor() {
    const botoes = document.querySelectorAll('.mood-btn');
    
    botoes.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            botoes.forEach(b => b.classList.remove('selected')); 
            btn.classList.add('selected'); 
            humorSelecionado = btn.getAttribute('data-mood'); 
        };
    })
}

function configurarSalvarDiario() {
    const btnSalvar = document.getElementById('btnSalvarDiario');
    if (!btnSalvar) return;

    btnSalvar.onclick = async () => {
        if (!humorSelecionado) {
            alert("Por favor, selecione como foi o seu dia (humor)!");
            return;
        }

        const texto = document.getElementById('diarioTexto').value;
        const data = document.getElementById('diarioData').value;

        if (!texto || !data) {
            alert("Preencha o texto e a data!");
            return;
        }

        btnSalvar.innerText = "Salvando...";
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('journal_entries').insert({
            user_id: user.id,
            mood: humorSelecionado,
            content: texto,
            created_at: data
        });

        if (!error) {
            document.getElementById('diarioTexto').value = '';
            humorSelecionado = '';
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            alert("Dia salvo com sucesso!");
            await carregarDiario(); 
        } else {
            alert("Erro ao salvar: " + error.message);
        }
        btnSalvar.innerText = "Salvar Dia";
    };
}

async function carregarDiario(dataFiltro = null) {
    const { data: { user } } = await supabase.auth.getUser();
    const listaEl = document.getElementById('listaDiario');
    if (!listaEl) return;

    listaEl.innerHTML = '<p style="text-align:center; color:#64748b">Carregando memórias...</p>';

    let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (dataFiltro) {
        const inicioDia = `${dataFiltro}T00:00:00Z`;
        const fimDia = `${dataFiltro}T23:59:59Z`;
        query = query.gte('created_at', inicioDia).lte('created_at', fimDia);
    }

    const { data, error } = await query;

    if (error) {
        listaEl.innerHTML = '<p>Erro ao carregar o histórico.</p>';
        return;
    }

    listaEl.innerHTML = '';
    
    if (data.length === 0) {
        if (dataFiltro) {
            const dataBr = dataFiltro.split('-').reverse().join('/');
            listaEl.innerHTML = `<p style="text-align:center; color:#64748b">Nenhum registro encontrado no dia ${dataBr}.</p>`;
        } else {
            listaEl.innerHTML = '<p style="text-align:center; color:#64748b">Nenhum registro ainda. Escreva sobre o seu dia!</p>';
        }
        return;
    }

    const emojisHumor = {
        'incrivel': '🤩', 'feliz': '🙂', 'neutro': '😐', 'cansado': '😫', 'triste': '😞'
    };

    data.forEach(item => {
        const dataFormatada = new Date(item.created_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const moodFormatado = item.mood ? item.mood.toLowerCase() : 'neutro';
        const emoji = emojisHumor[moodFormatado] || '📝';

        const card = document.createElement('div');
        card.className = `diary-card mood-${moodFormatado}`;
        
        card.innerHTML = `
            <div class="diary-header">
                <span>${dataFormatada}</span>
                <span style="font-size: 1.2rem;" title="${item.mood}">${emoji}</span>
            </div>
            <div class="diary-content">${item.content}</div>
            <div style="text-align: right; margin-top: 10px;">
                <button onclick="excluirDiario('${item.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size: 0.8rem; padding: 5px;">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        listaEl.appendChild(card);
    });
}

window.excluirDiario = async function(id) {
    if(confirm('Tem a certeza que deseja excluir esta memória?')) {
        await supabase.from('journal_entries').delete().eq('id', id);
        carregarDiario();
    }
};

// ==========================================
// 10. MÓDULO: HÁBITOS E PROJETOS 🎯
// ==========================================

// ------------------------------------------
// PARTE 1: HÁBITOS
// ------------------------------------------
function calcularStreak(logs) {
    if (!logs || logs.length === 0) return 0;

    const datas = [...new Set(logs.map(l => l.date ? l.date.substring(0, 10) : ''))].sort((a, b) => b.localeCompare(a));
    const hoje = new Date();
    const hojeStr = new Date(hoje.getTime() - (hoje.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const ontemStr = new Date(ontem.getTime() - (ontem.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    let streak = 0;
    let dataAtualVerificacao = new Date(hoje);

    if (datas.includes(hojeStr)) {
        // Ok
    } else if (datas.includes(ontemStr)) {
        dataAtualVerificacao = ontem;
    } else {
        return 0;
    }

    while (true) {
        const dataStr = new Date(dataAtualVerificacao.getTime() - (dataAtualVerificacao.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        if (datas.includes(dataStr)) {
            streak++;
            dataAtualVerificacao.setDate(dataAtualVerificacao.getDate() - 1); 
        } else {
            break; 
        }
    }
    return streak;
}

async function inicializarHabitos() {
    const btnAbrirModal = document.getElementById('btnAbrirModalHabito');
    const btnFecharModal = document.getElementById('fecharModalHabito');
    const modal = document.getElementById('modalHabito');
    const botoesCor = document.querySelectorAll('.color-btn');
    const btnSalvar = document.getElementById('btnSalvarHabito');

    if (!btnAbrirModal) return; 

    btnAbrirModal.addEventListener('click', () => {
        modal.classList.add('active');
        document.getElementById('habitoNome').value = ''; 
        document.getElementById('habitoNome').focus();
    });

    btnFecharModal.addEventListener('click', () => modal.classList.remove('active'));

    botoesCor.forEach(btn => {
        btn.addEventListener('click', (e) => {
            botoesCor.forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            corHabitoSelecionada = e.target.getAttribute('data-color');
        });
    });

    btnSalvar.addEventListener('click', salvarHabito);
    await carregarHabitos();
}

async function salvarHabito() {
    const nomeInput = document.getElementById('habitoNome').value.trim();
    if (!nomeInput) { alert('Por favor, digite o nome do hábito.'); return; }

    const { data: { user } } = await supabase.auth.getUser();
    const btnSalvar = document.getElementById('btnSalvarHabito');
    btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    btnSalvar.disabled = true;

    const { error } = await supabase.from('habits').insert({
        user_id: user.id, name: nomeInput, color: corHabitoSelecionada
    });

    btnSalvar.innerHTML = 'Salvar Hábito';
    btnSalvar.disabled = false;

    if (error) { alert('Erro ao salvar o hábito.'); return; }
    document.getElementById('modalHabito').classList.remove('active');
    await carregarHabitos();
}

async function carregarHabitos() {
    const { data: { user } } = await supabase.auth.getUser();
    const listaEl = document.getElementById('listaHabitos');
    if (!listaEl) return;

    const { data: habitos, error } = await supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
    const datasSemana = obterDatasDaSemanaAtual();
    const { data: logs } = await supabase.from('habit_logs').select('*').eq('user_id', user.id); 

    if (error) return;

    if (habitos.length === 0) {
        listaEl.innerHTML = `<div style="text-align: center; margin-top: 40px; color: #94a3b8;"><p>Nenhum hábito cadastrado ainda.</p></div>`;
        return;
    }

    listaEl.innerHTML = ''; 
    habitos.forEach(habito => {
        const card = document.createElement('div');
        card.className = 'habit-card';
        const logsDoHabito = logs ? logs.filter(l => l.habit_id === habito.id) : [];
        const streak = calcularStreak(logsDoHabito);

        let streakHtml = streak > 0 ? `<div title="${streak} dias!" style="color: #f59e0b; font-size: 0.85rem;"><i class="fas fa-fire"></i> ${streak}</div>` : '';
        let diasHtml = '';
        const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        for (let i = 0; i < 7; i++) {
            const dataDoDia = datasSemana[i];
            const isCompleted = logsDoHabito.some(log => log.date && log.date.startsWith(dataDoDia));
            const classeBtn = isCompleted ? 'day-btn completed' : 'day-btn';
            const corFundo = isCompleted ? `background-color: ${habito.color};` : '';

            diasHtml += `
                <div class="day-item">
                    <span class="day-label">${nomesDias[i]}</span>
                    <button class="${classeBtn}" style="${corFundo}" onclick="window.toggleHabito(this, '${habito.id}', '${dataDoDia}', '${habito.color}')"><i class="fas fa-check"></i></button>
                </div>`;
        }

        card.innerHTML = `
            <div class="habit-header">
                <div class="habit-color-indicator" style="background-color: ${habito.color};"></div>
                <div class="habit-title">${habito.name}</div>
                ${streakHtml} 
                <button class="habit-delete" onclick="excluirHabito('${habito.id}')"><i class="fas fa-trash"></i></button>
            </div>
            <div class="habit-days">${diasHtml}</div>`;
        listaEl.appendChild(card);
    });
}

window.toggleHabito = async function(btnNode, habitId, dataDoDia, cor) {
    const { data: { user } } = await supabase.auth.getUser();
    const isCompleted = btnNode.classList.contains('completed');

    if (isCompleted) {
        btnNode.classList.remove('completed'); btnNode.style.backgroundColor = ''; 
        await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', dataDoDia).eq('user_id', user.id);
    } else {
        btnNode.classList.add('completed'); btnNode.style.backgroundColor = cor; 
        await supabase.from('habit_logs').insert({ user_id: user.id, habit_id: habitId, date: dataDoDia });
    }
};

window.excluirHabito = async function(id) {
    if(confirm('Deseja excluir este hábito?')) {
        await supabase.from('habits').delete().eq('id', id);
        carregarHabitos();
    }
};


// ------------------------------------------
// PARTE 2: PROJETOS E METAS FINANCEIRAS 🚀
// ------------------------------------------
async function inicializarProjetos() {
    const btnNovo = document.getElementById('btnNovoProjeto');
    const modalProjeto = document.getElementById('modalProjeto');
    const closeProjeto = document.getElementById('closeProjeto');
    const formProjeto = document.getElementById('formProjeto');

    const modalTransacao = document.getElementById('modalTransacaoProjeto');
    const closeTransacao = document.getElementById('closeTransacaoProjeto');
    const formTransacao = document.getElementById('formTransacaoProjeto');

    // 1. Abrir e Fechar Modal de Novo Projeto
    if(btnNovo) btnNovo.onclick = () => { formProjeto.reset(); modalProjeto.classList.add('active'); };
    if(closeProjeto) closeProjeto.onclick = () => modalProjeto.classList.remove('active');
    
    // 2. Fechar Modal de Transação (Depósito/Saque)
    if(closeTransacao) closeTransacao.onclick = () => modalTransacao.classList.remove('active');

    // 3. Salvar Novo Projeto
    if(formProjeto) {
        formProjeto.onsubmit = async (e) => {
            e.preventDefault();
            const btnSubmit = formProjeto.querySelector('button');
            btnSubmit.innerText = "Salvando...";

            const nome = document.getElementById('projetoNome').value;
            const meta = window.desformatarMoeda(document.getElementById('projetoValorMeta').value);
            const dataLimite = document.getElementById('projetoDataLimite').value;
            
            const { data: { user } } = await supabase.auth.getUser();
            
            // Criar na tabela financial_goals
            await supabase.from('financial_goals').insert({
                user_id: user.id, 
                name: nome, 
                target_amount: meta, 
                current_amount: 0, 
                deadline: dataLimite || null
            });
            
            btnSubmit.innerText = "Salvar Projeto";
            modalProjeto.classList.remove('active');
            carregarProjetosFinanceiros();
        };
    }

    // 4. Salvar Depósito ou Retirada
    if(formTransacao) {
        formTransacao.onsubmit = async (e) => {
            e.preventDefault();
            const btnSubmit = formTransacao.querySelector('button');
            btnSubmit.innerText = "Processando...";

            const id = document.getElementById('transacaoProjetoId').value;
            const acao = document.getElementById('transacaoAcao').value;
            const valorInformado = window.desformatarMoeda(document.getElementById('transacaoValor').value);

            // Buscar o valor atual no banco
            const { data: goal } = await supabase.from('financial_goals').select('current_amount').eq('id', id).single();
            
            let novoValor = goal.current_amount;
            if (acao === 'depositar') novoValor += valorInformado;
            else novoValor -= valorInformado; // Sacar
            
            if (novoValor < 0) novoValor = 0; // Não permite ficar negativo

            await supabase.from('financial_goals').update({ current_amount: novoValor }).eq('id', id);
            
            btnSubmit.innerText = "Confirmar";
            modalTransacao.classList.remove('active');
            formTransacao.reset();
            carregarProjetosFinanceiros();
        };
    }

    await carregarProjetosFinanceiros();
}

async function carregarProjetosFinanceiros() {
    const { data: { user } } = await supabase.auth.getUser();
    const lista = document.getElementById('projetosLista');
    const totalDisplay = document.getElementById('total-saved-amount');
    
    if(!lista) return;
    lista.innerHTML = '<p style="text-align: center; color: #64748b; width: 100%;">Carregando metas...</p>';

    const { data: metas, error } = await supabase.from('financial_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    if(error) {
        lista.innerHTML = '<p style="color: red;">Erro ao carregar metas.</p>';
        return;
    }

    lista.innerHTML = '';
    let totalGuardadoGeral = 0;

    if(metas.length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; width: 100%; color: #94a3b8; margin-top: 40px;">
                <i class="fas fa-piggy-bank" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Nenhuma meta criada. Crie o seu primeiro projeto!</p>
            </div>`;
        if(totalDisplay) totalDisplay.innerText = formatarMoeda(0);
        return;
    }

    metas.forEach(meta => {
        totalGuardadoGeral += meta.current_amount;
        
        // Calcula a porcentagem
        const percentualBruto = meta.target_amount > 0 ? (meta.current_amount / meta.target_amount) * 100 : 0;
        const percentual = Math.min(percentualBruto, 100).toFixed(1); 
        const isConcluido = percentual >= 100;

        const dataFormatada = meta.deadline ? new Date(meta.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Sem data';

        const card = document.createElement('div');
        card.style = `background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid ${isConcluido ? '#10b981' : '#334155'};`;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h3 style="margin: 0 0 5px 0; color: #f8fafc; font-size: 1.1rem;">
                        ${isConcluido ? '<i class="fas fa-star" style="color: #10b981;"></i> ' : ''}${meta.name}
                    </h3>
                    <small style="color: #94a3b8;"><i class="fas fa-calendar"></i> ${dataFormatada}</small>
                </div>
                <button onclick="excluirProjetoFinanceiro('${meta.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 5px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9rem;">
                    <span style="color: #10b981; font-weight: bold;">${formatarMoeda(meta.current_amount)}</span>
                    <span style="color: #64748b;">de ${formatarMoeda(meta.target_amount)}</span>
                </div>
                <div style="width: 100%; background: #0f172a; height: 10px; border-radius: 5px; overflow: hidden;">
                    <div style="width: ${percentual}%; background: ${isConcluido ? '#10b981' : '#3b82f6'}; height: 100%; transition: width 0.3s;"></div>
                </div>
                <div style="text-align: right; font-size: 0.8rem; color: #cbd5e1; margin-top: 5px;">${percentual}% Concluído</div>
            </div>

            <button onclick="abrirTransacaoProjeto('${meta.id}')" style="width: 100%; padding: 10px; background: #334155; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background 0.2s;">
                <i class="fas fa-exchange-alt"></i> Depositar / Sacar
            </button>
        `;
        lista.appendChild(card);
    });

    if(totalDisplay) totalDisplay.innerText = formatarMoeda(totalGuardadoGeral);
}

// Funções globais ativadas pelos botões HTML
window.abrirTransacaoProjeto = function(id) {
    document.getElementById('transacaoProjetoId').value = id;
    document.getElementById('formTransacaoProjeto').reset();
    document.getElementById('modalTransacaoProjeto').classList.add('active');
};

window.excluirProjetoFinanceiro = async function(id) {
    if(confirm('Tem a certeza que deseja excluir esta meta?')) {
        await supabase.from('financial_goals').delete().eq('id', id);
        carregarProjetosFinanceiros();
    }
};

/* =====================================================================
   11. MÓDULO: ANÁLISE E INTELIGÊNCIA ARTIFICIAL 🧠 (O MANO)
   ===================================================================== */

// ==========================================
// FORMATADOR DE TEXTO DA IA
// ==========================================
function formatarTextoIA(texto) {
    if (!texto) return '';
    let html = texto;
    // Títulos e Negritos
    html = html.replace(/### (.*)/g, '<h4 style="color: #3b82f6; margin: 10px 0 5px 0;">$1</h4>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Listas
    html = html.replace(/^\* (.*$)/gim, '<li style="margin-left: 20px; color: #cbd5e1;">$1</li>');
    // Quebras de linha
    html = html.replace(/\n/g, '<br>');
    return html;
}


async function inicializarAnalise() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Busca TODAS as transações do utilizador
    const { data: transacoes, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Erro ao buscar dados para análise", error);
        return;
    }

    // 2. Gera o gráfico de evolução
    gerarGraficoEvolucao(transacoes);

    // 3. TENTA BUSCAR UMA ANÁLISE GUARDADA NA BASE DE DADOS 💾
    const resultadoDiv = document.getElementById('resultadoIA');
    const { data: ultimaAnalise } = await supabase
        .from('ai_analysis')
        .select('content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (ultimaAnalise && resultadoDiv) {
        // Se já existe uma análise, mostra-a no ecrã e poupa tokens!
        const dataFormatada = new Date(ultimaAnalise.created_at).toLocaleString('pt-BR');
        resultadoDiv.innerHTML = ultimaAnalise.content + 
            `<br><br><hr style="border-color:#334155; margin: 15px 0;"><small style="color: #64748b;"><i>💾 Última análise gerada em: ${dataFormatada}</i></small>`;
    }

    // 4. Configura o botão da Inteligência Artificial (para forçar uma atualização)
    configurarBotaoIA(transacoes);
}

function gerarGraficoEvolucao(transacoes) {
    const ctx = document.getElementById('graficoEvolucao');
    if (!ctx) return;

    const despesas = transacoes.filter(t => t.type === 'expense');
    const despesasPorData = {};
    despesas.forEach(t => {
        const dataStr = new Date(t.created_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        despesasPorData[dataStr] = (despesasPorData[dataStr] || 0) + t.amount;
    });

    const labels = Object.keys(despesasPorData);
    const valores = Object.values(despesasPorData);

    // 👇 O TRUQUE DE MESTRE: Atrasar 50 milissegundos para o HTML se organizar primeiro 👇
    setTimeout(() => {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Gastos Diários (R$)',
                    data: valores,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#334155' } },
                    x: { grid: { color: '#334155' } }
                },
                plugins: {
                    legend: { labels: { color: '#cbd5e1' } }
                }
            }
        });
    }, 50); // 50 milissegundos de fôlego!
}


function configurarBotaoIA(transacoes) {

    const btnGerar = document.getElementById('btnGerarAnalise');
    const resultadoDiv = document.getElementById('resultadoIA');
    const focoUsuarioEl = document.getElementById('focoUsuario'); 
    
    

    if (!btnGerar || !resultadoDiv) return;

    // Se já havia uma análise, mudamos o texto do botão para fazer sentido
    if (resultadoDiv.innerHTML.includes('Última análise gerada em')) {
        btnGerar.innerText = "Atualizar Análise (Gastar Tokens) 🔄";
    }

    btnGerar.addEventListener('click', async () => {
        if (transacoes.length === 0) {
            resultadoDiv.innerHTML = "Você ainda não tem transações suficientes para uma análise profunda, mano! Adiciona uns gastos no painel primeiro. 💰";
            return;
        }

        btnGerar.innerText = "A analisar os números... 📊";
        btnGerar.disabled = true;
        resultadoDiv.innerHTML = "<i class='fas fa-spinner fa-spin'></i> O MANO está a processar as suas despesas e a gerar um relatório novo...";

        let receitas = 0; let despesas = 0; const categorias = {};
        
        transacoes.forEach(t => {
            if (t.type === 'income') receitas += t.amount;
            else {
                despesas += t.amount;
                const cat = t.category || 'Outros';
                categorias[cat] = (categorias[cat] || 0) + t.amount;
            }
        });

        const saldo = receitas - despesas;
        
        const textoCategorias = Object.entries(categorias)
            .map(([cat, val]) => {
                const porcentagemRenda = receitas > 0 ? ((val / receitas) * 100).toFixed(1) : 0;
                return `- ${cat}: R$ ${val.toFixed(2)} (${porcentagemRenda}% da renda total)`;
            }).join('\n');

        const focoDigitado = focoUsuarioEl && focoUsuarioEl.value.trim() !== '' 
            ? focoUsuarioEl.value 
            : "Fazer uma análise geral de saúde financeira, encontrar gargalos e sugerir melhorias onde eu estiver a gastar mais.";

        const prompt = `
            Você é o MANO, um assistente pessoal financeiro brasileiro, amigável e direto.
            PERSONALIDADE:
            - Tom: Amigo próximo, motivador, sem ser invasivo ou dar sermões.
            - Linguagem: Português informal.
            - Emojis: Use moderadamente.
            - NUNCA julgue negativamente os gastos.

            DADOS REAIS DESTE MÊS:
            - Receitas Totais: R$ ${receitas.toFixed(2)}
            - Despesas Totais: R$ ${despesas.toFixed(2)}
            - Saldo/Economia do Mês: R$ ${saldo.toFixed(2)}
            
            Gastos por Categoria:
            ${textoCategorias}
            
            🎯 FOCO PRINCIPAL DO USUÁRIO NESTA ANÁLISE:
            "${focoDigitado}"

            INSTRUÇÕES IMPORTANTES:
            Gere um relatório real preenchendo a estrutura abaixo. NÃO copie os colchetes, substitua-os pela sua análise financeira real, inteligente e baseada nos números acima!

            USE EXATAMENTE ESTA ESTRUTURA HTML (NÃO USE MARKDOWN):
            <br>
            <b>Fala, mano! Analisei os teus números e foquei no que me pediste:</b><br><br>
            
            <b>1. Visão Geral 🔍</b><br>
            [Escreva aqui 2 frases resumindo a relação entre receita e despesa e se o saldo é positivo/negativo]<br><br>
            
            <b>2. Análise Estratégica 💸</b><br>
            [Escreva aqui a análise da categoria que mais consumiu dinheiro e dê um conselho direto sobre o Foco Principal do usuário]<br><br>
            
            <b>3. Plano de Ação 🎯</b><br>
            <ul>
            <li>[Escreva o passo prático 1]</li>
            <li>[Escreva o passo prático 2]</li>
            <li>[Escreva o passo prático 3]</li>
            </ul>
        `;

        try {
            // Lembrete: Coloque aqui o modelo exato que funcionou para você antes (ex: models/gemini-2.0-flash)
            const apiKeyAtual = window.GEMINI_API_KEY;
            const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modeloEscolhido}:generateContent?key=${apiKeyAtual}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
                })
            });

            if (!resposta.ok) {
                const erroDoGoogle = await resposta.json();
                throw new Error(erroDoGoogle.error?.message || "Erro desconhecido na API");
            }

            const dados = await resposta.json();
            
            let textoCru = dados.candidates[0]?.content?.parts[0]?.text || "Desculpa, não consegui gerar a análise desta vez.";
            let htmlResposta = formatarTextoIA(textoCru);

            // 👇 3. A MÁGICA FINAL: GUARDA A RESPOSTA NA BASE DE DADOS 👇
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('ai_analysis').insert({
                user_id: user.id,
                content: htmlResposta
            });
            // -----------------------------------------------------------

            resultadoDiv.innerHTML = htmlResposta + 
                `<br><br><hr style="border-color:#334155; margin: 15px 0;"><small style="color: #64748b;"><i>💾 Nova análise guardada com sucesso!</i></small>`;

        } catch (erro) {
            console.error("🚨 ERRO CAPTURADO:", erro);
            resultadoDiv.innerHTML = `<span style='color: #ef4444;'>Ups mano, deu erro: <b>${erro.message}</b>. Tenta novamente mais tarde!</span>`;
        } finally {
            btnGerar.innerText = "Atualizar Análise 🔄";
            btnGerar.disabled = false;
        }
    });
}



/* // ==========================================
// 2. LÓGICA DO CHATBOX COM MEMÓRIA (SUPABASE)
// ==========================================
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessage');
const chatMessages = document.getElementById('chatMessages');

// --- FUNÇÃO AUXILIAR: DESENHAR BALÕES NO ECRÃ ---
function renderizarMensagemNoEcra(texto, tipo) {
    if (tipo === 'user') {
        chatMessages.innerHTML += `
            <div class="message user" style="text-align: right; margin-bottom: 12px;">
                <p style="background: #3b82f6; color: white; display: inline-block; padding: 10px 15px; border-radius: 12px 12px 0 12px; margin: 0; max-width: 80%; text-align: left; font-size: 0.9rem;">
                    ${texto}
                </p>
            </div>
        `;
    } else {
        chatMessages.innerHTML += `
            <div class="message bot" style="margin-bottom: 12px; text-align: left;">
                <p style="background: #1e293b; color: #f8fafc; display: inline-block; padding: 10px 15px; border-radius: 12px 12px 12px 0; margin: 0; max-width: 85%; font-size: 0.9rem;">
                    ${typeof formatarTextoIA === 'function' ? formatarTextoIA(texto) : texto}
                </p>
            </div>
        `;
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function enviarMensagemChat() {
    const textoUsuario = chatInput.value.trim();
    if (!textoUsuario) return;

    renderizarMensagemNoEcra(textoUsuario, 'user');
    await salvarMensagemNoBanco('user', textoUsuario);
    chatInput.value = '';

    const idDigitando = "typing-" + Date.now();
    chatMessages.innerHTML += `
        <div id="${idDigitando}" class="message bot" style="margin-bottom: 12px; text-align: left;">
            <p style="background: #1e293b; color: #94a3b8; display: inline-block; padding: 10px 15px; border-radius: 12px 12px 12px 0; margin: 0; font-size: 0.9rem;">
                <i class="fas fa-spinner fa-spin"></i> Mano IA está pensando...
            </p>
        </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const systemPrompt = `Você é o 'Mano IA'. Responda APENAS em JSON puro, sem textos fora das chaves.
        Formato: {"acao": "vazio", "valor": 0, "descricao": "", "mensagem": "Sua resposta aqui"}
        Ações: 'adicionar_despesa', 'adicionar_receita', 'criar_lembrete', 'vazio'.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modeloEscolhido}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt + "\nUsuário: " + textoUsuario }] }]
            })
        });

        const dados = await response.json();
        if (!dados.candidates) throw new Error("IA fora do ar");

        let respostaIARaw = dados.candidates[0].content.parts[0].text;
        
        // --- O PULO DO GATO: LIMPEZA DE JSON ---
        let comando;
        try {
            // Remove possíveis crases que a IA coloca (```json ... ```)
            const jsonLimpo = respostaIARaw.replace(/```json|```/g, "").trim();
            comando = JSON.parse(jsonLimpo);
        } catch (e) {
            console.warn("IA não mandou JSON puro, tratando como texto.");
            comando = { acao: "vazio", mensagem: respostaIARaw };
        }
        // ---------------------------------------

        // Executar ações apenas se o JSON estiver correto
        if (comando.acao && comando.acao !== "vazio") {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (comando.acao === "adicionar_despesa") {
                    await supabase.from('transactions').insert({ user_id: user.id, description: comando.descricao, amount: comando.valor, type: 'expense', category: 'Geral' });
                }
                // ... adicione os outros elses (lembretes, etc) aqui ...
            }
        }

        const digitandoElem = document.getElementById(idDigitando);
        if (digitandoElem) digitandoElem.remove();

        renderizarMensagemNoEcra(comando.mensagem, 'assistant');
        await salvarMensagemNoBanco('assistant', comando.mensagem);

        // Atualiza os cards sem recarregar a página
        if (typeof carregarResumoHome === 'function') carregarResumoHome();

    } catch (erro) {
        console.error("Erro no Chat:", erro);
        const digitandoElem = document.getElementById(idDigitando);
        if (digitandoElem) digitandoElem.remove();
        renderizarMensagemNoEcra("Eita, me perdi aqui. Pode repetir?", 'assistant');
    }
}

// --- FUNÇÕES DE BANCO DE DADOS (SUPABASE) ---

async function salvarMensagemNoBanco(role, content) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('chat_messages').insert({ user_id: user.id, role: role, content: content });
}

async function carregarHistoricoChat() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: mensagens, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) return;

    chatMessages.innerHTML = ''; // Limpa para carregar o histórico
    
    // Se não houver mensagens, mostra a saudação inicial
    if (mensagens.length === 0) {
        renderizarMensagemNoEcra("E aí, Mano! Tudo certo? 🤙<br>Sou seu assistente pessoal. Posso ajudar com finanças, projetos e lembretes. Só falar! 🚀", 'assistant');
    } else {
        mensagens.forEach(msg => {
            renderizarMensagemNoEcra(msg.content, msg.role);
        });
    }
}

async function limparHistoricoChat() {
    if (!confirm("Queres mesmo apagar todo o histórico de conversa?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('chat_messages').delete().eq('user_id', user.id);
    chatMessages.innerHTML = '';
    renderizarMensagemNoEcra("Histórico apagado! Como posso ajudar agora? 🚀", 'assistant');
}

// --- INICIALIZAÇÃO ---
/* 
if (sendMessageBtn) sendMessageBtn.onclick = enviarMensagemChat;
if (chatInput) chatInput.onkeypress = (e) => { if (e.key === 'Enter') enviarMensagemChat(); };
*/

