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
    });

    const calcularIndicadores = useCallback((vendasData) => {
        const totalVendido = vendasData.reduce((acc, venda) => acc + venda.total_venda, 0);
        const totalComissao = vendasData.reduce((acc, venda) => acc + venda.total_comissao, 0);
        
        setIndicadores({
            totalVendido,
            totalComissao,
            numeroDeVendas: vendasData.length,
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
        return <AdminLayout title="Indicadores de Vendas"><p>Carregando...</p></AdminLayout>;
    }

    return (
        <AdminLayout title="Indicadores de Vendas">
            {error && <p className="error-message">{error}</p>}

            <div className="reports-grid">
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
                <h3>Todas as Vendas</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Quiosque</th>
                            <th>Vendedor</th>
                            <th>Total (R$)</th>
                            <th>Comissão (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendas.map(venda => (
                            <tr key={venda.id}>
                                <td>{new Date(venda.data_venda.seconds * 1000).toLocaleDateString()}</td>
                                <td>{venda.identificadorQuiosque}</td>
                                <td>{venda.nomeVendedor}</td>
                                <td>{venda.total_venda.toFixed(2)}</td>
                                <td>{venda.total_comissao.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
};

export default ReportsPage;