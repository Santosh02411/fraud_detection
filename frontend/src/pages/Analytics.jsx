import React, { useState, useEffect, useRef } from 'react';
import { analyticsService } from '../services/api';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Network, 
  Share2, 
  Search, 
  Filter, 
  Download,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Analytics = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [trends, setTrends] = useState(null);
  const [merchants, setMerchants] = useState(null);
  const [loading, setLoading] = useState(true);
  const graphRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gRes, tRes, mRes] = await Promise.all([
        analyticsService.getGraphData(),
        analyticsService.getTrends(),
        analyticsService.getMerchantAnalysis()
      ]);
      setGraphData(gRes.data);
      setTrends(tRes.data);
      setMerchants(mRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-slate-400 mt-1">Graph-based relationship analysis and behavioral deep dives</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 glass glass-hover text-sm font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Data
          </button>
          <button onClick={fetchData} className="btn-primary">Recalculate Models</button>
        </div>
      </header>

      {/* Relationship Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass p-6 overflow-hidden relative min-h-[500px]">
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="font-bold flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              Transaction Relationship Map
            </h3>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-2 h-2 bg-safe rounded-full"></span> Normal
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-2 h-2 bg-fraud rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span> Fraud
              </span>
            </div>
          </div>
          
          <div className="absolute inset-0 top-16">
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              nodeLabel={(node) => `ID: ${node.id} | Merchant: ${node.merchant} | Amount: $${node.amount}`}
              nodeColor={(node) => (node.is_fraud ? '#ef4444' : '#10b981')}
              nodeRelSize={6}
              linkColor={() => 'rgba(255,255,255,0.05)'}
              backgroundColor="rgba(0,0,0,0)"
              width={800}
              height={440}
              d3VelocityDecay={0.3}
            />
          </div>
          
          <div className="absolute bottom-6 left-6 p-4 glass bg-background/80 backdrop-blur-md max-w-[200px] z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Info className="w-3 h-3" /> Graph Insights
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Nodes represent transactions. Edges show shared Merchants, Locations, or IPs. Clusters often indicate organized fraud rings.
            </p>
          </div>
        </div>

        <div className="glass p-6 flex flex-col">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-secondary" />
            Fraud Clusters
          </h3>
          <div className="space-y-4 flex-1">
            {graphData.clusters?.length > 0 ? graphData.clusters.map((cluster, i) => (
              <div key={i} className="p-4 rounded-2xl bg-fraud/5 border border-fraud/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-fraud" />
                  <span className="text-xs font-bold text-fraud uppercase">Cluster #{i+1}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {cluster.length} related transactions showing highly suspicious patterns.
                </p>
                <button className="mt-3 text-[10px] font-bold text-primary hover:underline">Investigate Group</button>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
                <Network className="w-12 h-12" />
                <p className="text-xs text-center">No organized clusters detected in this window</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6">
          <h3 className="font-bold mb-6">Probability Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.probability_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e1e2e', border: 'none', borderRadius: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {trends?.probability_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index > 3 ? '#ef4444' : index > 1 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6">
          <h3 className="font-bold mb-6">Risky Merchants</h3>
          <div className="space-y-4">
            {merchants?.risky_merchants.length > 0 ? merchants.risky_merchants.map((m, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">
                    {m.merchant.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{m.merchant}</p>
                    <p className="text-[10px] text-slate-500">{m.transaction_count} transactions analyzed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-fraud">{m.fraud_rate.toFixed(1)}%</p>
                  <p className="text-[10px] text-slate-500">Fraud Rate</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 text-center py-12">No high-risk merchants identified yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
