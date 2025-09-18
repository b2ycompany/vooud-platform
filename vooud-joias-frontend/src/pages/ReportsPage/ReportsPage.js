import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { getVendasComDetalhes } from '../../services/operationsService';
import './ReportsPage.css';

const ReportsPage = () => {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [indicadores, setIndicadores] = useState({
        totalVendido: 0,
        totalComissao: 0,
        numeroDeVendas: 0,
        totalPorLoja: {},
        comissaoPorVendedor: {},
    });

    const calcularIndicadores = useCallback((vendasData) => {
        const totalVendido = vendasData.reduce((acc, venda) => acc + venda.total, 0);
        const totalComissao = vendasData.reduce((acc, venda) => acc + (venda.itens ? venda.itens.reduce((total, item) => total + (item.valor_comissao || 0), 0) : 0), 0);
        
        const totalPorLoja = vendasData.reduce((acc, venda) => {
            const nomeLoja = venda.nomeLoja || 'N/A';
            acc[nomeLoja] = (acc[nomeLoja] || 0) + venda.total;
            return acc;
        }, {});

        const comissaoPorVendedor = vendasData.reduce((acc, venda) => {
            const nomeVendedor = venda.nomeVendedor || 'N/A';
            const totalComissaoVenda = venda.itens.reduce((total, item) => total + (item.valor_comissao || 0), 0);
            acc[nomeVendedor] = (acc[nomeVendedor] || 0) + totalComissaoVenda;
            return acc;
        }, {});

        setIndicadores({
            totalVendido,
            totalComissao,
            numeroDeVendas: vendasData.length,
            totalPorLoja,
            comissaoPorVendedor,
        });
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const vendasData = await getVendasComDetalhes();
            setVendas(vendasData);
            calcularIndicadores(vendasData);
        } catch (err) {
            setError("Erro ao carregar os dados de vendas.");
        } finally {
            setLoading(false);
        }
    }, [calcularIndicadores]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <AdminLayout title="Relatórios"><p>Carregando dados...</p></AdminLayout>;
    }

    return (
        <AdminLayout title="Relatórios Gerenciais">
            {error && <p className="error-message">{error}</p>}
            <div className="reports-indicators-grid">
                <div className="indicator-card">
                    <h4>Total Vendido</h4>
                    <p>R$ {indicadores.totalVendido.toFixed(2)}</p>
                </div>
                <div className="indicator-card">
                    <h4>Total em Comissões</h4>
                    <p>R$ {indicadores.totalComissao.toFixed(2)}</p>
                </div>
                <div className="indicator-card">
                    <h4>Número de Vendas</h4>
                    <p>{indicadores.numeroDeVendas}</p>
                </div>
            </div>

            <div className="card">
                <h3>Vendas por Loja</h3>
                <ul>
                    {Object.entries(indicadores.totalPorLoja).map(([loja, total]) => (
                        <li key={loja}><strong>{loja}:</strong> R$ {total.toFixed(2)}</li>
                    ))}
                </ul>
            </div>
            
            <div className="card">
                <h3>Comissões por Vendedor</h3>
                <ul>
                    {Object.entries(indicadores.comissaoPorVendedor).map(([vendedor, comissao]) => (
                        <li key={vendedor}><strong>{vendedor}:</strong> R$ {comissao.toFixed(2)}</li>
                    ))}
                </ul>
            </div>

            <div className="card">
                <h3>Todas as Vendas</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Loja</th>
                            <th>Quiosque</th>
                            <th>Vendedor</th>
                            <th>Total (R$)</th>
                            <th>Comissão (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendas.map(venda => (
                            <tr key={venda.id}>
                                <td>{new Date(venda.data?.seconds * 1000).toLocaleDateString()}</td>
                                <td>{venda.nomeLoja}</td>
                                <td>{venda.identificadorQuiosque}</td>
                                <td>{venda.nomeVendedor}</td>
                                <td>{venda.total?.toFixed(2)}</td>
                                <td>{venda.itens?.reduce((total, item) => total + (item.valor_comissao || 0), 0).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
};

export default ReportsPage;