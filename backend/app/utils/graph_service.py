import pandas as pd
import networkx as nx

class GraphService:
    def __init__(self):
        self.G = nx.Graph()
        
    def build_transaction_graph(self, transactions):
        """Build a graph where nodes are transactions and edges represent shared attributes"""
        self.G.clear()
        
        for tx in transactions:
            tx_id = tx.get('id')
            self.G.add_node(tx_id, **tx)
            
            # Find relationships with existing nodes
            for node, data in self.G.nodes(data=True):
                if node == tx_id:
                    continue
                
                # Relationship factors
                shared_factors = 0
                if data.get('merchant') == tx.get('merchant'):
                    shared_factors += 1
                if data.get('ip_address') == tx.get('ip_address') and tx.get('ip_address'):
                    shared_factors += 2
                if data.get('location') == tx.get('location'):
                    shared_factors += 1
                    
                if shared_factors > 0:
                    self.G.add_edge(tx_id, node, weight=shared_factors)
                    
    def get_related_transactions(self, tx_id):
        """Get all transactions related to a specific transaction ID"""
        if tx_id not in self.G:
            return []
            
        neighbors = list(self.G.neighbors(tx_id))
        related = []
        for n in neighbors:
            data = self.G.nodes[n].copy()
            data['weight'] = self.G.edges[tx_id, n]['weight']
            related.append(data)
            
        return related

    def get_fraud_clusters(self):
        """Find clusters of potentially fraudulent transactions"""
        clusters = []
        for component in nx.connected_components(self.G):
            if len(component) > 1:
                # Check if any in component are fraud
                is_fraud_cluster = any(self.G.nodes[node].get('is_fraud') for node in component)
                if is_fraud_cluster:
                    clusters.append(list(component))
        return clusters
