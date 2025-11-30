
import React, { useState, useMemo } from 'react';
import { Order } from '../../types';
import { Search, Filter, X, ShoppingBag, User, Mail, Truck, Calendar, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const getStatusColor = (status: Order['status']) => {
    switch (status) {
        case 'Pending': return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';
        case 'Processing': return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
        case 'Shipped': return 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30';
        case 'Delivered': return 'bg-green-900/30 text-green-400 border-green-500/30';
        case 'Cancelled': return 'bg-red-900/30 text-red-400 border-red-500/30';
        default: return 'bg-gray-800 text-gray-400';
    }
};

const AdminOrders: React.FC = () => {
    const { orders, updateOrder, deleteOrder } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [newStatus, setNewStatus] = useState<Order['status'] | ''>('');

    const filteredOrders = useMemo(() => {
        return orders
            .filter(order => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    order.orderNumber.toLowerCase().includes(searchLower) ||
                    order.customerName.toLowerCase().includes(searchLower) ||
                    order.customerEmail.toLowerCase().includes(searchLower)
                );
            })
            .filter(order => {
                return statusFilter ? order.status === statusFilter : true;
            });
    }, [orders, searchTerm, statusFilter]);

    const handleSelectOrder = (order: Order) => {
        setSelectedOrder(order);
        setNewStatus(order.status);
    };

    const handleUpdateStatus = async () => {
        if (selectedOrder && newStatus) {
            await updateOrder({ ...selectedOrder, status: newStatus as Order['status'] });
            setSelectedOrder(null);
            setNewStatus('');
        }
    };
    
    const handleDeleteOrder = async (orderId: string) => {
        if (window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
            await deleteOrder(orderId);
            setSelectedOrder(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-[22px] font-bold text-white">Order Management</h1>

            <div className="bg-zinc-900 p-4 rounded-xl border border-gray-800 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search by Order #, Name, or Email..."
                        className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm focus:border-pink-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <select
                        className="pl-10 pr-8 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm outline-none appearance-none"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>
            
            {/* Orders List - Desktop Table */}
            <div className="hidden md:block bg-zinc-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-950 border-b border-gray-800 text-gray-400 font-medium">
                        <tr>
                            <th className="p-4">Order #</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4">Status</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-zinc-800/50 group transition-colors">
                                <td className="p-4 font-mono text-cyan-400">{order.orderNumber}</td>
                                <td className="p-4 text-gray-400">{new Date(order.date).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <div className="font-medium text-gray-200">{order.customerName}</div>
                                    <div className="text-xs text-gray-500">{order.customerEmail}</div>
                                </td>
                                <td className="p-4 text-right font-bold text-green-400">R{order.total.toFixed(2)}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleSelectOrder(order)} className="text-xs text-gray-400 hover:text-white underline opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredOrders.length === 0 && <div className="p-8 text-center text-gray-500">No orders found.</div>}
            </div>

            {/* Orders List - Mobile Cards */}
            <div className="md:hidden space-y-4">
                {filteredOrders.map(order => (
                    <div key={order.id} className="bg-zinc-900 p-4 rounded-xl border border-gray-800 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-mono text-cyan-400 text-sm">{order.orderNumber}</div>
                                <div className="text-xs text-gray-500">{new Date(order.date).toLocaleString()}</div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <div>
                            <div className="font-medium text-gray-200 text-sm">{order.customerName}</div>
                            <div className="text-xs text-gray-500">{order.customerEmail}</div>
                        </div>
                        <div className="flex justify-between items-end pt-2 border-t border-gray-800">
                            <button onClick={() => handleSelectOrder(order)} className="text-xs text-gray-400 hover:text-white underline">
                                View Details
                            </button>
                            <div className="font-bold text-green-400 text-lg">R{order.total.toFixed(2)}</div>
                        </div>
                    </div>
                ))}
                 {filteredOrders.length === 0 && <div className="p-8 text-center text-gray-500">No orders found.</div>}
            </div>
            
            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
                    <div className="bg-zinc-900 border border-gray-800 rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-800">
                            <div>
                                <h2 className="text-xl font-bold text-white">Order Details</h2>
                                <p className="font-mono text-cyan-400">{selectedOrder.orderNumber}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 bg-zinc-800 rounded-full text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-gray-800">
                                    <User size={16} className="text-gray-500"/>
                                    <span className="text-gray-300">{selectedOrder.customerName}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-gray-800">
                                    <Mail size={16} className="text-gray-500"/>
                                    <span className="text-gray-300">{selectedOrder.customerEmail}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-gray-800">
                                    <Calendar size={16} className="text-gray-500"/>
                                    <span className="text-gray-300">{new Date(selectedOrder.date).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
                                <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Truck size={18} className="text-cyan-400"/>Shipping Information</h3>
                                <div className="text-sm space-y-1">
                                    <p><strong className="text-gray-400">Method:</strong> <span className="text-gray-200">{selectedOrder.shippingMethod}</span></p>
                                    <p><strong className="text-gray-400">Details:</strong> <span className="text-gray-200">{selectedOrder.shippingDetails}</span></p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <h3 className="font-bold text-white flex items-center gap-2"><ShoppingBag size={18} className="text-pink-400"/>Items ({selectedOrder.items.reduce((acc, i) => acc + i.quantity, 0)})</h3>
                                {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-gray-800">
                                        <img src={item.images[0]} alt={item.name} className="w-12 h-12 rounded object-cover border border-gray-700"/>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">{item.name}</p>
                                            <p className="text-xs text-gray-400">
                                                {item.selectedSize && `Size: ${item.selectedSize}`}
                                                {item.selectedMaterial && `Material: ${item.selectedMaterial}`}
                                            </p>
                                        </div>
                                        <div className="text-sm text-gray-400">x{item.quantity}</div>
                                        <div className="text-sm font-bold text-white">R{(item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4 border-t border-gray-800 text-sm text-right space-y-2">
                                <div className="flex justify-end gap-4"><span className="text-gray-400">Subtotal:</span> <span className="text-gray-200 w-24 text-left">R{(selectedOrder.total - selectedOrder.shippingCost).toFixed(2)}</span></div>
                                <div className="flex justify-end gap-4"><span className="text-gray-400">Shipping:</span> <span className="text-gray-200 w-24 text-left">R{selectedOrder.shippingCost.toFixed(2)}</span></div>
                                <div className="flex justify-end gap-4 font-bold text-lg"><span className="text-white">Total:</span> <span className="text-green-400 w-24 text-left">R{selectedOrder.total.toFixed(2)}</span></div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-800 bg-zinc-950/50 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <label className="text-sm font-bold text-white">Status:</label>
                                <select
                                    value={newStatus}
                                    onChange={e => setNewStatus(e.target.value as Order['status'])}
                                    className="flex-1 bg-black border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-pink-500 outline-none"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                <button onClick={handleUpdateStatus} className="px-4 py-2 bg-pink-600 text-white font-bold rounded-lg text-sm hover:bg-pink-500">
                                    Save
                                </button>
                            </div>
                            <button 
                                onClick={() => handleDeleteOrder(selectedOrder.id)}
                                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-red-400 text-sm font-bold hover:bg-red-900/20 rounded-lg border border-red-900/0 hover:border-red-900/30 transition-colors"
                            >
                                <Trash2 size={16}/> Delete Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
