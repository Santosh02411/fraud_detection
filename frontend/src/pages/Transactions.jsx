import React, { useState, useEffect } from "react";
import { transactionService } from "../services/api";
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { motion } from "framer-motion";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  // Listen for new transactions from simulator
  useEffect(() => {
    const handler = () => {
      setPage(1); // Reset to page 1 to see latest transactions
    };
    window.addEventListener("transactionProcessed", handler);
    return () => window.removeEventListener("transactionProcessed", handler);
  }, []);

  const fetchTransactions = async (pageNum = page) => {
    setLoading(true);
    try {
      const response = await transactionService.getHistory(pageNum);
      setTransactions(response.data.transactions);
      setTotalPages(response.data.pages);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-slate-400 mt-1">
            Audit trail for all incoming financial activities
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 glass glass-hover text-sm font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </header>

      <div className="glass overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by merchant or ID..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Sorted by</span>
            <button className="flex items-center gap-1 font-bold text-slate-200">
              Timestamp <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-white/10">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Merchant</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Risk %</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td
                        colSpan="7"
                        className="px-6 py-6 h-16 bg-white/5 opacity-20"
                      ></td>
                    </tr>
                  ))
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          tx.is_fraud
                            ? "bg-fraud/10 text-fraud"
                            : "bg-safe/10 text-safe"
                        }`}
                      >
                        {tx.is_fraud ? "FLAGGED" : "CLEARED"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono">
                        #{tx.id.toString().padStart(6, "0")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold">{tx.merchant}</p>
                      <p className="text-[10px] text-slate-500">
                        {tx.category}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-200">
                        ${tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${tx.fraud_probability > 50 ? "bg-fraud" : "bg-safe"}`}
                            style={{ width: `${tx.fraud_probability}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono">
                          {tx.fraud_probability.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(tx.timestamp).toLocaleDateString()}{" "}
                      {new Date(tx.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-4 h-4 text-slate-400 hover:text-primary" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-20 text-center text-slate-500"
                  >
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/5">
          <p className="text-[10px] text-slate-500">
            Showing page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 glass glass-hover disabled:opacity-20"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 glass glass-hover disabled:opacity-20"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
