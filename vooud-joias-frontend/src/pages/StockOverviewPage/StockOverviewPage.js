import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { getAggregatedStock } from '../../services/operationsService'; // 1. Importando a nova função
import { toast } from 'react-toastify';
import './StockOverviewPage.css'; // 2. Importando o novo arquivo de estilo

const StockOverviewPage = () => {
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // 3. Estado para a barra de busca

    // --- Lógica de Busca de Dados ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 4. Usando a nova função para buscar e agregar os dados do estoque
            const data = await getAggregatedStock();
            setStockData(data);
        } catch (err) {
            toast.error("Erro ao carregar o resumo do estoque.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 5. Lógica para filtrar os dados com base na busca do usuário
    const filteredStock = useMemo(() => {
        if (!searchTerm) {
            return stockData;
        }
        return stockData.filter(item =>
            item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stockData, searchTerm]);

    return (
        <AdminLayout title="Visão Geral de Estoque">
            <div className="card">
                <h3>Estoque Consolidado por Produto</h3>
                <p>
                    Visualize o estoque total de cada joia, somando as quantidades de todos os quiosques.
                </p>
                
                {/* 6. Barra de Busca */}
                <div className="search-bar-container">
                    <input
                        type="text"
                        placeholder="Buscar por nome ou SKU..."
                        className="input-field"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <p>Carregando dados...</p>
                ) : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Joia</th>
                                    <th>SKU</th>
                                    <th>Estoque Total</th>
                                    <th>Distribuição nos Quiosques</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStock.length > 0 ? (
                                    filteredStock.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.nome}</td>
                                            <td>{item.sku}</td>
                                            <td><strong>{item.totalEstoque}</strong></td>
                                            <td>
                                                <ul className="distribution-list">
                                                    {item.distribuicao.map(dist => (
                                                        <li key={dist.quiosqueId}>
                                                            {dist.quiosqueNome}: <strong>{dist.quantidade}</strong>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4">Nenhum item encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default StockOverviewPage;