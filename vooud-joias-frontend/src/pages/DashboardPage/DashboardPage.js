import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Verifique se o caminho para seu arquivo de configuração do Firebase está correto
import { collection, doc, runTransaction, addDoc, serverTimestamp } from 'firebase/firestore';
import { getJoias } from '../../services/catalogService'; // Serviço que você criou para buscar as joias
import './DashboardPage.css'; // Arquivo de estilos para o componente

// Supondo que você use um Contexto de Autenticação para obter dados do usuário logado
// import { useAuth } from '../../contexts/AuthContext'; 

const DashboardPage = () => {
    // Se você usa um contexto de autenticação, pode pegar os dados do usuário assim:
    // const { currentUser } = useAuth(); 
    
    // --- DADOS ESTÁTICOS PARA EXEMPLO ---
    // Substitua pela lógica real para obter o ID do vendedor e do quiosque
    const vendedorId = "ID_DO_VENDEDOR_LOGADO"; 
    const quiosqueId = "ID_DO_QUIOSQUE_ATUAL";

    // --- ESTADOS DO COMPONENTE ---
    const [joiasDisponiveis, setJoiasDisponiveis] = useState([]); // Lista de produtos para exibir
    const [carrinho, setCarrinho] = useState([]); // Lista de itens no carrinho de compras local
    const [loading, setLoading] = useState(false); // Para feedback visual durante o processamento
    const [error, setError] = useState(''); // Para exibir mensagens de erro
    const [success, setSuccess] = useState(''); // Para exibir mensagens de sucesso

    // --- EFEITO PARA CARREGAR OS PRODUTOS QUANDO A PÁGINA ABRE ---
    useEffect(() => {
        const carregarJoias = async () => {
            try {
                const joias = await getJoias(); // Busca os produtos do seu serviço
                setJoiasDisponiveis(joias);
            } catch (err) {
                setError("Falha ao carregar os produtos. Verifique sua conexão.");
            }
        };
        carregarJoias();
    }, []);

    // Função para limpar as mensagens de erro e sucesso
    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    // --- FUNÇÕES DE GERENCIAMENTO DO CARRINHO (LÓGICA LOCAL) ---

    /**
     * Adiciona um item ao carrinho ou incrementa sua quantidade se já existir.
     * @param {object} joia - O objeto do produto a ser adicionado.
     * @param {number} quantidade - A quantidade a ser adicionada (padrão 1).
     */
    const handleAddItemAoCarrinho = (joia, quantidade = 1) => {
        clearMessages();
        setCarrinho(prevCarrinho => {
            const itemExistente = prevCarrinho.find(item => item.id === joia.id);
            
            if (itemExistente) {
                // Se o item já existe, apenas atualiza a quantidade
                return prevCarrinho.map(item =>
                    item.id === joia.id ? { ...item, quantidade: item.quantidade + quantidade } : item
                );
            } else {
                // Se é um novo item, adiciona ao carrinho
                return [...prevCarrinho, { ...joia, quantidade }];
            }
        });
    };

    /**
     * Remove um item completamente do carrinho.
     * @param {string} joiaId - O ID do produto a ser removido.
     */
    const handleRemoverItemDoCarrinho = (joiaId) => {
        clearMessages();
        setCarrinho(prevCarrinho => prevCarrinho.filter(item => item.id !== joiaId));
    };

    /**
     * Calcula o valor total dos itens no carrinho.
     * @returns {string} O valor total formatado com duas casas decimais.
     */
    const calcularTotal = () => {
        return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0).toFixed(2);
    };

    // --- FUNÇÃO DE VENDA COM TRANSAÇÃO SEGURA NO FIRESTORE ---
    const handleFinalizarVenda = async () => {
        clearMessages();
        if (carrinho.length === 0) {
            setError("O carrinho está vazio.");
            return;
        }
        setLoading(true);

        try {
            // Inicia uma transação atômica
            await runTransaction(db, async (transaction) => {
                // Mapeia os itens do carrinho para referências de documentos no inventário
                // IMPORTANTE: Assumimos que cada joia tem uma propriedade 'inventarioId' que aponta para o documento no inventário.
                const inventarioRefs = carrinho.map(item => doc(db, "inventario", item.inventarioId));

                // =================================================================
                // FASE 1: LEITURAS - Ler todos os estoques primeiro
                // =================================================================
                const inventarioDocs = await Promise.all(
                    inventarioRefs.map(ref => transaction.get(ref))
                );

                // =================================================================
                // FASE 2: VALIDAÇÃO - Verificar se há estoque para todos os itens
                // =================================================================
                for (let i = 0; i < carrinho.length; i++) {
                    const itemCarrinho = carrinho[i];
                    const inventarioDoc = inventarioDocs[i];

                    if (!inventarioDoc.exists()) {
                        throw new Error(`O item "${itemCarrinho.nome}" não foi encontrado no inventário.`);
                    }

                    const estoqueAtual = inventarioDoc.data().quantidade;
                    if (estoqueAtual < itemCarrinho.quantidade) {
                        // Se o estoque for insuficiente, lança um erro que cancela toda a transação
                        throw new Error(`Estoque insuficiente para "${itemCarrinho.nome}". Disponível: ${estoqueAtual}`);
                    }
                }

                // =================================================================
                // FASE 3: ESCRITAS - Se tudo foi validado, realizar as escritas
                // =================================================================
                // 3.1: Atualizar o estoque de cada item
                for (let i = 0; i < carrinho.length; i++) {
                    const itemCarrinho = carrinho[i];
                    const inventarioDoc = inventarioDocs[i];
                    const novoEstoque = inventarioDoc.data().quantidade - itemCarrinho.quantidade;
                    
                    transaction.update(inventarioRefs[i], { quantidade: novoEstoque });
                }

                // 3.2: Criar o registro da venda na coleção "vendas"
                const vendaRef = doc(collection(db, "vendas"));
                transaction.set(vendaRef, {
                    vendedorId: vendedorId,
                    quiosqueId: quiosqueId,
                    itens: carrinho, // Salva uma cópia dos itens vendidos
                    total: parseFloat(calcularTotal()),
                    data: serverTimestamp() // Usa o timestamp do servidor para a data da venda
                });
            });

            setSuccess("Venda realizada com sucesso!");
            setCarrinho([]); // Limpa o carrinho após a venda ser bem-sucedida
        } catch (err) {
            // Este 'catch' captura os erros lançados na validação (ex: estoque insuficiente)
            // ou qualquer outro erro que o Firestore possa retornar durante a transação.
            console.error("Erro na transação:", err); // Loga o erro original no console para depuração
            setError(err.message || "Ocorreu um erro ao finalizar a venda. Tente novamente.");
        } finally {
            setLoading(false); // Garante que o estado de 'loading' seja desativado, mesmo se der erro
        }
    };

    // --- RENDERIZAÇÃO DO COMPONENTE (JSX) ---
    return (
        <div className="dashboard-pdv">
            {/* Área para exibir mensagens de feedback */}
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <div className="pdv-grid">
                {/* Coluna da Esquerda: Lista de Produtos Disponíveis */}
                <div className="produtos-disponiveis">
                    <h3>Produtos</h3>
                    <div className="lista-produtos">
                        {joiasDisponiveis.map(joia => (
                            <div key={joia.id} className="produto-card" onClick={() => handleAddItemAoCarrinho(joia)}>
                                <h4>{joia.nome}</h4>
                                <p>R$ {joia.preco.toFixed(2)}</p>
                                <p>SKU: {joia.sku}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coluna da Direita: Carrinho e Finalização */}
                <div className="carrinho-pdv">
                    <h3>Carrinho</h3>
                    <div className="lista-carrinho">
                        {carrinho.length === 0 ? (
                            <p>Nenhum item adicionado.</p>
                        ) : (
                            carrinho.map(item => (
                                <div key={item.id} className="carrinho-item">
                                    <span>{item.nome} (x{item.quantidade})</span>
                                    <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                                    <button onClick={() => handleRemoverItemDoCarrinho(item.id)} className="remove-btn">Remover</button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="carrinho-total">
                        <strong>Total: R$ {calcularTotal()}</strong>
                    </div>
                    <button 
                        className="finalizar-venda-btn" 
                        onClick={handleFinalizarVenda} 
                        disabled={loading || carrinho.length === 0}
                    >
                        {loading ? 'Processando...' : 'Finalizar Venda'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;