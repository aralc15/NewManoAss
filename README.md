# Mano Financeiro - Controle Financeiro Simples

Uma aplicação web simples e moderna para controle financeiro pessoal, desenvolvida com HTML, CSS e JavaScript puro.

## 🚀 Funcionalidades

- ✅ **Adicionar Receitas e Despesas** - Registre suas transações facilmente
- ✅ **Visualizar Saldo** - Acompanhe seu saldo atual em tempo real
- ✅ **Filtrar Transações** - Por período, tipo e categoria
- ✅ **Gráficos Interativos** - Visualize seus gastos por categoria
- ✅ **Relatórios** - Análises detalhadas do seu financeiro
- ✅ **Exportar Dados** - Baixe seus dados em formato JSON
- ✅ **Interface Responsiva** - Funciona em desktop e mobile
- ✅ **Armazenamento Local** - Seus dados ficam salvos no navegador

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura da aplicação
- **CSS3** - Estilos modernos e responsivos
- **JavaScript (ES6+)** - Lógica da aplicação
- **Chart.js** - Gráficos interativos
- **Font Awesome** - Ícones
- **Google Fonts** - Tipografia moderna

## 📁 Estrutura do Projeto

```
mano-financeiro-simples/
├── index.html          # Página principal
├── style.css          # Estilos da aplicação
├── script.js          # Lógica JavaScript
└── README.md          # Este arquivo
```

## 🚀 Como Usar

### Opção 1: Abrir Localmente
1. Baixe/clone este repositório
2. Abra o arquivo `index.html` no seu navegador
3. Pronto! A aplicação funcionará offline

### Opção 2: Servidor Local
```bash
# Usando Python
python -m http.server 8000

# Usando Node.js
npx http-server

# Usando PHP
php -S localhost:8000
```

## 💡 Como Funciona

### Armazenamento
- Os dados são salvos no **localStorage** do navegador
- Não requer banco de dados ou servidor
- Dados persistem entre sessões

### Funcionalidades Principais

#### Adicionando Transações
1. Clique em "Receita" ou "Despesa"
2. Preencha os campos: valor, categoria, descrição, data
3. Clique em "Salvar"

#### Visualizando Dados
- **Saldo Atual**: Mostra receitas menos despesas
- **Lista de Transações**: Histórico completo
- **Gráfico**: Distribuição por categoria

#### Filtros
- **Período**: Hoje, semana, mês, ano ou todos
- **Tipo**: Receitas, despesas ou ambos
- **Categoria**: Filtrar por categoria específica

#### Relatórios
- Estatísticas detalhadas por período
- Análise de receitas vs despesas
- Saldo consolidado

## 🎨 Personalização

### Cores
As cores podem ser alteradas no arquivo `style.css` nas variáveis CSS:

```css
:root {
    --primary-color: #2563eb;    /* Azul principal */
    --success-color: #059669;    /* Verde para receitas */
    --danger-color: #dc2626;     /* Vermelho para despesas */
}
```

### Categorias
Para adicionar novas categorias, edite o objeto `CATEGORIAS` no `script.js`:

```javascript
const CATEGORIAS = {
    receita: [
        'Salário', 'Freelance', 'Presente', // ... adicione aqui
    ],
    despesa: [
        'Alimentação', 'Transporte', // ... adicione aqui
    ]
};
```

## 🔄 Migração Futura

Este projeto foi desenvolvido para ser facilmente migrado para um banco de dados real (como Supabase, Firebase, etc.) quando necessário. A estrutura modular facilita essa transição.

## 📱 Compatibilidade

- ✅ Chrome/Chromium (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Navegadores móveis modernos

## 🤝 Contribuição

Este é um projeto pessoal, mas sugestões são bem-vindas! Sinta-se à vontade para:

- Reportar bugs
- Sugerir melhorias
- Compartilhar ideias

## 📄 Licença

Este projeto é de uso pessoal. Sinta-se livre para usar, modificar e distribuir como quiser.

---

**Desenvolvido com ❤️ para ajudar no controle financeiro pessoal**