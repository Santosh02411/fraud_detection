import React, { useState } from "react";
import { transactionService } from "../services/api";
import {
  Zap,
  RefreshCcw,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Info,
  DollarSign,
  Layers,
  Fingerprint,
  CreditCard,
  MapPin,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Simulator = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [mode, setMode] = useState("auto"); // 'auto' or 'manual'
  const [formData, setFormData] = useState({
    amount: "",
    merchant: "",
    category: "Shopping",
    location: "",
    cardNumber: "**** **** **** 4242",
    isHighRisk: false,
  });

  const handleSimulate = async () => {
    setSimulating(true);
    setLoading(true);
    setResult(null);
    try {
      const response = await transactionService.simulate();
      setResult(response.data);
      window.dispatchEvent(new Event("transactionProcessed"));
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setLoading(false);
      setTimeout(() => setSimulating(false), 500);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.amount || !formData.merchant || !formData.location) {
      alert("Please fill in Amount, Merchant, and Location fields");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        merchant: formData.merchant,
        category: formData.category,
        location: formData.location,
        time: Math.floor(Date.now() / 1000) % 86400,
      };

      // Add high risk markers if requested
      if (formData.isHighRisk) {
        for (let i = 1; i <= 28; i++) {
          payload[`V${i}`] = 2.5 + Math.random(); // High risk values
        }
      }

      const response = await transactionService.predict(payload);
      setResult(response.data);
      window.dispatchEvent(new Event("transactionProcessed"));
    } catch (err) {
      console.error("Manual prediction failed", err);
      alert(
        "Failed to process transaction: " +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Transaction Simulator
          </h1>
          <p className="text-slate-400 mt-1">
            Generate real-time transactions to test the ML detection engine
          </p>
        </div>
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            onClick={() => setMode("auto")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === "auto" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}
          >
            Auto Stream
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === "manual" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}
          >
            Manual Entry
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Input Visualization */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 h-full flex flex-col">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              {mode === "auto" ? (
                <RefreshCcw className="w-4 h-4 text-primary" />
              ) : (
                <CreditCard className="w-4 h-4 text-primary" />
              )}
              {mode === "auto"
                ? "Incoming Data Stream"
                : "New Transaction Details"}
            </h3>

            {mode === "auto" ? (
              <div className="flex-1 flex flex-col justify-center gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Fingerprint className="w-12 h-12" />
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                    Payload Status
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${result ? "bg-safe shadow-lg shadow-safe/50" : "bg-slate-700"}`}
                    ></div>
                    <span className="text-sm font-mono">
                      {result ? "TRANSACTION_RECEIVED" : "AWAITING_INPUT..."}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Processing Latency</span>
                    <span className="font-mono text-primary">12ms</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: loading ? "100%" : "0%" }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSimulate}
                  disabled={loading}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-3"
                >
                  <Zap
                    className={`w-4 h-4 ${simulating ? "animate-bounce" : ""}`}
                  />
                  {loading ? "Processing..." : "Generate Random"}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleManualSubmit}
                className="flex-1 flex flex-col gap-4"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="Card Number"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                        placeholder="Amount"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div className="relative">
                      <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
                      >
                        <option value="Shopping">Shopping</option>
                        <option value="Food">Food</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Bills">Bills</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <Zap className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      name="merchant"
                      value={formData.merchant}
                      onChange={handleInputChange}
                      required
                      placeholder="Merchant Name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      placeholder="Location (City/Country)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        name="isHighRisk"
                        checked={formData.isHighRisk}
                        onChange={handleInputChange}
                        className="peer hidden"
                      />
                      <div className="w-5 h-5 rounded border border-white/20 peer-checked:bg-fraud peer-checked:border-fraud transition-all"></div>
                      <ShieldAlert className="absolute inset-0 m-auto w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                      Test High Risk Detection
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full mt-4 h-11 flex items-center justify-center gap-3"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading ? "Analyzing..." : "Authorize Transaction"}
                </button>
              </form>
            )}

            <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex gap-3">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {mode === "auto"
                    ? "The simulator generates synthetic transaction data with PCA-transformed features (V1-V28) that mirror the real credit card dataset structure."
                    : 'Manually entering details allows you to test specific merchants and amounts. Check "High Risk" to simulate abnormal behavioral patterns.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results Analysis */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Result Header */}
                <div
                  className={`glass p-8 border-l-4 ${result.fraud_prediction.is_fraud ? "border-l-fraud" : "border-l-safe"}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div
                        className={`p-4 rounded-2xl ${result.fraud_prediction.is_fraud ? "bg-fraud/10 text-fraud" : "bg-safe/10 text-safe"}`}
                      >
                        {result.fraud_prediction.is_fraud ? (
                          <ShieldAlert className="w-10 h-10" />
                        ) : (
                          <ShieldCheck className="w-10 h-10" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">
                          {result.fraud_prediction.is_fraud
                            ? "Potential Fraud Detected"
                            : "Transaction Validated"}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                          Ref ID:{" "}
                          <span className="font-mono text-xs">
                            #{result.transaction_id.toString().padStart(6, "0")}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                        Risk Score
                      </p>
                      <p
                        className={`text-3xl font-black ${result.fraud_prediction.fraud_probability > 50 ? "text-fraud" : "text-safe"}`}
                      >
                        {result.fraud_prediction.fraud_probability.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Insights Chips */}
                  <div className="flex flex-wrap gap-2 mt-8">
                    {result.fraud_prediction.insights.map((insight, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-medium text-slate-300"
                      >
                        {insight}
                      </span>
                    ))}
                    {result.fraud_prediction.is_anomaly && (
                      <span className="px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full text-[10px] font-bold text-secondary">
                        ANOMALY_DETECTION_POSITIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Features Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass p-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Layers className="w-3 h-3 text-primary" /> Feature
                      Importance
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(result.feature_importance).map(
                        ([feature, value], i) => (
                          <div key={feature} className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="font-mono">{feature}</span>
                              <span className="text-slate-500">
                                {(value * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${value * 100}%` }}
                                transition={{ delay: i * 0.1 }}
                                className="h-full bg-primary"
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="glass p-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-secondary" />{" "}
                      Behavioral Baseline
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">
                          Avg Transaction
                        </span>
                        <span className="text-sm font-bold">
                          ${result.behavior_analysis.avg_amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">
                          Historical Count
                        </span>
                        <span className="text-sm font-bold">
                          {result.behavior_analysis.transaction_count}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">
                          User Risk Level
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            result.behavior_analysis.risk_level === "Low"
                              ? "bg-safe/20 text-safe"
                              : "bg-fraud/20 text-fraud"
                          }`}
                        >
                          {result.behavior_analysis.risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center glass border-dashed opacity-50">
                <div className="p-6 rounded-full bg-white/5 mb-4">
                  <Zap className="w-12 h-12 text-slate-600" />
                </div>
                <p className="text-slate-500 font-medium">
                  Ready to simulate. Click the button above.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
